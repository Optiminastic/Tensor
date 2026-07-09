import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tensor',
    short_name: 'Tensor',
    description: '3D printing design costing and selling-price approval.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1b1c1f',
    theme_color: '#1b1c1f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
