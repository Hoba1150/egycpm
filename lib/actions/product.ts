"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { encryptData, decryptData } from "@/lib/encryption";

export interface ProductFilterParams {
  categorySlug?: string;
  productType?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isLimited?: boolean;
  sortBy?: "newest" | "price_asc" | "price_desc" | "sales" | "discount";
  inStockOnly?: boolean;
  isCpm2?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Get Filtered Products for Catalog & Shop
 */
export async function getProducts(params: ProductFilterParams = {}) {
  const {
    categorySlug,
    productType,
    search,
    minPrice,
    maxPrice,
    isFeatured,
    isBestSeller,
    isLimited,
    sortBy = "newest",
    inStockOnly = false,
    isCpm2 = false,
    page = 1,
    limit = 24,
  } = params;

  const where: any = {
    isActive: true,
  };

  // CPM 2 vs Main Store strict separation
  if (isCpm2 || productType === "CPM2") {
    where.OR = [
      { productType: "CPM2" },
      { category: { slug: { contains: "cpm" } } },
      { category: { name: { contains: "CPM" } } },
      { category: { name: { contains: "cpm" } } },
    ];
    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }
  } else {
    // MAIN STORE ONLY: strictly exclude any CPM 2 products and CPM 2 categories
    where.NOT = [
      { productType: "CPM2" },
      { category: { slug: { contains: "cpm" } } },
      { category: { name: { contains: "CPM" } } },
      { category: { name: { contains: "cpm" } } },
    ];

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (productType && productType !== "ALL") {
      where.productType = productType;
    }
  }

  if (search && search.trim()) {
    const searchConditions = [
      { name: { contains: search.trim() } },
      { description: { contains: search.trim() } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = Number(minPrice);
    if (maxPrice !== undefined) where.price.lte = Number(maxPrice);
  }

  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;
  if (isLimited !== undefined) where.isLimited = isLimited;

  if (inStockOnly) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { stockType: "UNLIMITED" },
          { stockQuantity: { gt: 0 } },
        ],
      },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "price_asc") orderBy = { price: "asc" };
  else if (sortBy === "price_desc") orderBy = { price: "desc" };
  else if (sortBy === "sales") orderBy = { totalSales: "desc" };
  else if (sortBy === "discount") orderBy = { discountPercent: "desc" };

  try {
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: {
            where: { isApproved: true, isHidden: false },
            select: { rating: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const items = products.map((prod) => {
      const ratings = prod.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;

      let imagesArray: string[] = [];
      try {
        imagesArray = JSON.parse(prod.images || "[]");
      } catch {
        imagesArray = [prod.images];
      }

      return {
        ...prod,
        imagesArray,
        avgRating: Number(avgRating.toFixed(1)),
        reviewCount: ratings.length,
      };
    });

    return {
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("getProducts error:", error);
    return { items: [], totalCount: 0, totalPages: 0, currentPage: page };
  }
}

/**
 * Get Random Active Products for Hero Showcase Slider (Main Store only)
 */
export async function getRandomProducts(count: number = 5) {
  try {
    const allActiveProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        NOT: [
          { productType: "CPM2" },
          { category: { slug: { contains: "cpm" } } },
          { category: { name: { contains: "CPM" } } },
          { category: { name: { contains: "cpm" } } },
        ],
      },
      include: {
        category: true,
        reviews: {
          where: { isApproved: true, isHidden: false },
          select: { rating: true },
        },
      },
    });

    if (allActiveProducts.length === 0) return [];

    // Shuffle randomly
    const shuffled = [...allActiveProducts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return selected.map((prod) => {
      const ratings = prod.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;

      let imagesArray: string[] = [];
      try {
        imagesArray = JSON.parse(prod.images || "[]");
      } catch {
        imagesArray = [prod.images];
      }

      return {
        ...prod,
        imagesArray,
        avgRating: Number(avgRating.toFixed(1)),
        reviewCount: ratings.length,
      };
    });
  } catch (error) {
    console.error("getRandomProducts error:", error);
    return [];
  }
}

/**
 * Get Single Product by Slug (Supports encoded slugs, IDs, and masked game account preview)
 */
export async function getProductBySlug(slug: string) {
  try {
    const rawSlug = slug;
    let decodedSlug = rawSlug;
    try {
      decodedSlug = decodeURIComponent(rawSlug);
    } catch {
      // ignore
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: rawSlug },
          { slug: decodedSlug },
          { id: rawSlug },
        ],
      },
      include: {
        category: true,
        reviews: {
          where: { isApproved: true, isHidden: false },
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) return null;

    let imagesArray: string[] = [];
    try {
      imagesArray = JSON.parse(product.images || "[]");
    } catch {
      imagesArray = [product.images];
    }

    let specs: any = null;
    try {
      specs = product.detailedSpecs ? JSON.parse(product.detailedSpecs) : null;
    } catch {
      specs = null;
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;

    // Mask game account email for preview (show only first 2 letters)
    const isGameAccount =
      product.productType === "GAME_ACCOUNT" ||
      product.productType === "ACCOUNT" ||
      Boolean(product.accountDetailsEncrypted);

    let maskedAccountEmail: string | null = null;
    if (isGameAccount && product.accountDetailsEncrypted) {
      try {
        const decryptedJson = decryptData(product.accountDetailsEncrypted);
        if (decryptedJson) {
          const parsed = JSON.parse(decryptedJson);
          if (parsed.email) {
            const emailStr = String(parsed.email).trim();
            const atIndex = emailStr.indexOf("@");
            if (atIndex > 2) {
              const firstTwo = emailStr.slice(0, 2);
              const domain = emailStr.slice(atIndex);
              maskedAccountEmail = `${firstTwo}••••••${domain}`;
            } else if (emailStr.length > 2) {
              maskedAccountEmail = `${emailStr.slice(0, 2)}••••••••`;
            } else {
              maskedAccountEmail = `${emailStr}••••`;
            }
          }
        }
      } catch {
        maskedAccountEmail = "ac••••••@gmail.com";
      }
    }

    const isSoldOut = !product.isActive || product.stockQuantity <= 0;

    // Sanitize: do NOT send raw encrypted payload to frontend
    const { accountDetailsEncrypted, ...safeProduct } = product;

    return {
      ...safeProduct,
      imagesArray,
      specs,
      avgRating: Number(avgRating.toFixed(1)),
      reviewCount: ratings.length,
      isGameAccount,
      maskedAccountEmail,
      isSoldOut,
    };
  } catch (error) {
    console.error("getProductBySlug error:", error);
    return null;
  }
}


/**
 * Get Categories (Separated by main store vs CPM2)
 */
export async function getCategories(forCpm2?: boolean) {
  try {
    const where: any = { isActive: true };
    if (forCpm2 === true) {
      where.OR = [
        { slug: { contains: "cpm" } },
        { name: { contains: "CPM" } },
        { name: { contains: "cpm" } },
      ];
    } else {
      where.NOT = [
        { slug: { contains: "cpm" } },
        { name: { contains: "CPM" } },
        { name: { contains: "cpm" } },
      ];
    }

    return await prisma.category.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}


/**
 * Admin: Get Product Details with Decrypted Account Details for Editing
 */
export async function getAdminProductDetails(id: string) {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return null;

  let gameAccountData: { email?: string; password?: string; notes?: string } | null = null;
  if (product.accountDetailsEncrypted) {
    try {
      const decrypted = decryptData(product.accountDetailsEncrypted);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        gameAccountData = {
          email: parsed.email || "",
          password: parsed.password || "",
          notes: parsed.notes || "",
        };
      }
    } catch {
      gameAccountData = {
        email: "",
        password: "",
        notes: decryptData(product.accountDetailsEncrypted) || "",
      };
    }
  }

  return {
    ...product,
    gameAccountData,
  };
}

/**
 * Admin: Create Product
 */
export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discountPercent?: number;
  categoryId: string;
  productType: any;
  stockType: any;
  stockQuantity: number;
  images: string[];
  detailedSpecs?: any;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isLimited?: boolean;
  deliveryTimeMinutes?: number;
  serviceRequirements?: string;
  accountDetailsEncrypted?: string;
  gameAccountData?: {
    email?: string;
    password?: string;
    notes?: string;
  };
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const slug = `${slugify(data.name)}-${Math.floor(1000 + Math.random() * 9000)}`;

  let accountDetailsEncrypted = data.accountDetailsEncrypted || null;
  if (data.gameAccountData && (data.gameAccountData.email || data.gameAccountData.password || data.gameAccountData.notes)) {
    accountDetailsEncrypted = encryptData(
      JSON.stringify({
        email: data.gameAccountData.email?.trim() || "",
        password: data.gameAccountData.password || "",
        notes: data.gameAccountData.notes?.trim() || "",
      })
    );
  }

  const isGameAccount = data.productType === "GAME_ACCOUNT" || data.productType === "ACCOUNT";

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      discountPercent: data.discountPercent ? Number(data.discountPercent) : 0,
      categoryId: data.categoryId,
      productType: data.productType || "STOCK_CAR",
      stockType: isGameAccount ? "ONE_OF_ONE" : (data.stockType || "UNLIMITED"),
      stockQuantity: isGameAccount ? 1 : Number(data.stockQuantity || 999),
      images: JSON.stringify(data.images || []),
      detailedSpecs: data.detailedSpecs ? JSON.stringify(data.detailedSpecs) : null,
      isFeatured: Boolean(data.isFeatured),
      isBestSeller: Boolean(data.isBestSeller),
      isLimited: isGameAccount ? true : Boolean(data.isLimited),
      deliveryTimeMinutes: isGameAccount ? 0 : Number(data.deliveryTimeMinutes || 15),
      serviceRequirements: data.serviceRequirements || null,
      accountDetailsEncrypted,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: product.id,
      afterValue: JSON.stringify(product),
    },
  });

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { success: true, product };
}

/**
 * Admin: Update Product
 */
export async function updateProduct(id: string, data: Partial<any>) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const oldProduct = await prisma.product.findUnique({ where: { id } });
  if (!oldProduct) throw new Error("المنتج غير موجود.");

  const updatePayload: any = { ...data };
  if (data.images && Array.isArray(data.images)) {
    updatePayload.images = JSON.stringify(data.images);
  }
  if (data.detailedSpecs && typeof data.detailedSpecs === "object") {
    updatePayload.detailedSpecs = JSON.stringify(data.detailedSpecs);
  }
  if (data.price !== undefined) updatePayload.price = Number(data.price);
  if (data.originalPrice !== undefined) updatePayload.originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
  if (data.stockQuantity !== undefined) updatePayload.stockQuantity = Number(data.stockQuantity);

  if (data.gameAccountData) {
    if (data.gameAccountData.email || data.gameAccountData.password || data.gameAccountData.notes) {
      updatePayload.accountDetailsEncrypted = encryptData(
        JSON.stringify({
          email: data.gameAccountData.email?.trim() || "",
          password: data.gameAccountData.password || "",
          notes: data.gameAccountData.notes?.trim() || "",
        })
      );
    }
    delete updatePayload.gameAccountData;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updatePayload,
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: id,
      beforeValue: JSON.stringify(oldProduct),
      afterValue: JSON.stringify(updatedProduct),
    },
  });

  revalidatePath("/shop");
  revalidatePath(`/product/${updatedProduct.slug}`);
  revalidatePath("/admin/products");
  return { success: true, product: updatedProduct };
}


/**
 * Admin: Toggle Product Active Status (enable/disable without deleting)
 */
export async function toggleProductActive(id: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new Error("المنتج غير موجود.");

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: updated.isActive ? "ACTIVATE_PRODUCT" : "DEACTIVATE_PRODUCT",
      targetType: "PRODUCT",
      targetId: id,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { success: true, isActive: updated.isActive };
}

/**
 * Admin: Hard Delete Product permanently from the database
 */
export async function deleteProduct(id: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  // Hard delete - permanently remove from database
  await prisma.product.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_PRODUCT",
      targetType: "PRODUCT",
      targetId: id,
    },
  });

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  return { success: true };
}

/**
 * Admin: Create Category
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  order?: number;
  isCpm2?: boolean;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.name || !data.name.trim()) {
    throw new Error("يرجى إدخال اسم القسم.");
  }

  const rawSlug = slugify(data.name);
  const baseSlug = data.isCpm2
    ? (rawSlug.startsWith("cpm") ? rawSlug : `cpm2-${rawSlug}`)
    : rawSlug;
  const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

  const category = await prisma.category.create({
    data: {
      name: data.name.trim(),
      slug,
      description: data.description?.trim() || null,
      image: data.image?.trim() || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
      icon: data.icon?.trim() || "FolderTree",
      order: Number(data.order || 0),
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_CATEGORY",
      targetType: "CATEGORY",
      targetId: category.id,
      afterValue: JSON.stringify(category),
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/cars");
  return { success: true, category };
}

/**
 * Admin: Update Category
 */
export async function updateCategory(id: string, data: {
  name?: string;
  description?: string;
  image?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const oldCategory = await prisma.category.findUnique({ where: { id } });
  if (!oldCategory) throw new Error("القسم غير موجود.");

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      description: data.description !== undefined ? data.description.trim() : undefined,
      image: data.image !== undefined ? data.image.trim() : undefined,
      icon: data.icon !== undefined ? data.icon.trim() : undefined,
      order: data.order !== undefined ? Number(data.order) : undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_CATEGORY",
      targetType: "CATEGORY",
      targetId: id,
      beforeValue: JSON.stringify(oldCategory),
      afterValue: JSON.stringify(updatedCategory),
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/cars");
  return { success: true, category: updatedCategory };
}

/**
 * Admin: Delete Category
 */
export async function deleteCategory(id: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    // If category has products, deactivate it rather than throwing foreign key error
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    await prisma.category.delete({ where: { id } });
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_CATEGORY",
      targetType: "CATEGORY",
      targetId: id,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/cars");
  return { success: true };
}

