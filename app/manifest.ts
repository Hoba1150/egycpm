import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EGY CPM | متجر كار باركينج الاحترافي',
    short_name: 'EGY CPM',
    description: 'المتجر الأول لتعديل وشحن سيارات لعبة Car Parking Multiplayer وكينج رانك وكاش 50M.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050507',
    theme_color: '#07090e',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
