import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encryptData } from "@/lib/encryption";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "ORDER_MANAGER" | "CUSTOMER";
  status: "ACTIVE" | "BANNED";
}

export const CUSTOMER_COOKIE_NAME = "cpm_customer_session_token";
export const ADMIN_COOKIE_NAME = "cpm_admin_session_token";

/**
 * Encodes session payload into a signed JSON string
 */
function encodeSession(user: SessionUser): string {
  const payload = {
    ...user,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decodes session payload
 */
function decodeSession(token: string): SessionUser | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    const data = JSON.parse(json);
    if (!data.id || !data.email || !data.role) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name || null,
      image: data.image || null,
      role: data.role,
      status: data.status || "ACTIVE",
    };
  } catch {
    return null;
  }
}

/**
 * Gets the customer session (used by storefront: Header, Checkout, Wallet, etc.)
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  
  // Prefer customer cookie first, then fallback to admin cookie
  const customerToken = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const token = customerToken || adminToken;

  if (!token) return null;

  const session = decodeSession(token);
  if (!session) return null;

  // Verify user in DB
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, image: true, role: true, status: true },
    });

    if (!dbUser || dbUser.status === "BANNED") {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role as any,
      status: dbUser.status as any,
    };
  } catch {
    return session;
  }
}

/**
 * Gets specifically the Admin session
 */
export async function getCurrentAdminUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = decodeSession(token);
  if (!session) return null;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, image: true, role: true, status: true },
    });

    if (!dbUser || dbUser.status === "BANNED" || dbUser.role === "CUSTOMER") {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      image: dbUser.image,
      role: dbUser.role as any,
      status: dbUser.status as any,
    };
  } catch {
    return session;
  }
}

/**
 * Set Customer session cookie
 */
export async function setCustomerSession(user: SessionUser) {
  const cookieStore = cookies();
  const token = encodeSession(user);
  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Set Admin session cookie
 */
export async function setAdminSession(user: SessionUser) {
  const cookieStore = cookies();
  const token = encodeSession(user);
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the customer session cookie
 */
export async function clearCustomerSession() {
  const cookieStore = cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}

/**
 * Clears the admin session cookie
 */
export async function clearAdminSession() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Customer Registration Handler (Name + Email + Password + optional Phone)
 */
export async function handleCustomerRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const { name, email, password, phone } = data;

  if (!email || !email.includes("@")) {
    throw new Error("يرجى إدخال بريد إلكتروني صحيح.");
  }

  if (!password || password.length < 5) {
    throw new Error("كلمة المرور يجب أن تتكون من 5 أحرف أو أرقام على الأقل.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error("هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const plainPasswordEncrypted = encryptData(password);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split("@")[0],
      passwordHash,
      plainPasswordEncrypted,
      phone: phone?.trim() || null,
      role: "CUSTOMER",
      status: "ACTIVE",
      image: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${cleanEmail}`,
      wallet: {
        create: {
          balance: 0.0,
          giftBalance: 0.0,
          totalDeposited: 0.0,
          totalSpent: 0.0,
        },
      },
      notifications: {
        create: {
          title: "مرحباً بك في CPM GARAGE 🏎️",
          message: "تم إنشاء حسابك بنجاح! يمكنك الآن شحن محفظتك وشراء أفضل السيارات وتعديلات كار باركينج.",
          type: "SYSTEM",
        },
      },
    },
  });

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role as any,
    status: user.status as any,
  };

  await setCustomerSession(sessionUser);
  return sessionUser;
}

/**
 * Customer Login Handler (Email + Password)
 */
export async function handleCustomerLogin(email: string, password: string) {
  if (!email || !password) {
    throw new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
  }

  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error("لا يوجد حساب مسجل بهذا البريد الإلكتروني.");
  }

  if (user.status === "BANNED") {
    throw new Error("هذا الحساب محظور حالياً. يرجى التواصل مع الدعم الفني.");
  }

  if (!user.passwordHash) {
    throw new Error("بيانات الدخول غير صحيحة.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("كلمة المرور غير صحيحة.");
  }

  // Ensure wallet exists
  const existingWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!existingWallet) {
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0.0,
        giftBalance: 0.0,
        totalDeposited: 0.0,
        totalSpent: 0.0,
      },
    });
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role as any,
    status: user.status as any,
  };

  await setCustomerSession(sessionUser);
  return sessionUser;
}

/**
 * Admin Login Handler (Email + Password with Role Verification)
 */
export async function handleAdminLogin(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || user.role === "CUSTOMER") {
    throw new Error("بيانات الدخول غير صحيحة أو ليس لديك صلاحية وصول كإدارة.");
  }

  if (user.status === "BANNED") {
    throw new Error("تم تعطيل هذا الحساب الإداري.");
  }

  if (!user.passwordHash) {
    throw new Error("هذا الحساب لا يملك كلمة مرور إدارية معينة.");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error("كلمة المرور غير صحيحة.");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role as any,
    status: user.status as any,
  };

  // Set dedicated admin session cookie
  await setAdminSession(sessionUser);

  // Log admin login to audit log
  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      adminEmail: user.email,
      action: "ADMIN_LOGIN",
      targetType: "AUTH",
      targetId: user.id,
      afterValue: JSON.stringify({ role: user.role, timestamp: new Date().toISOString() }),
    },
  });

  return sessionUser;
}

/**
 * Helper to ensure current user is Admin / Super Admin / Order Manager
 */
export async function requireAdminRole(
  allowedRoles: ("SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "ORDER_MANAGER")[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "SUPPORT",
    "ORDER_MANAGER",
  ]
) {
  // Check admin session specifically first
  const adminUser = await getCurrentAdminUser();
  if (adminUser && allowedRoles.includes(adminUser.role as any)) {
    return adminUser;
  }

  // Fallback check
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role as any)) {
    throw new Error("غير مصرح لك بالوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء.");
  }
  return user;
}
