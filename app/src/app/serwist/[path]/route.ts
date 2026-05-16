import { createSerwistRoute } from '@serwist/turbopack';

const { GET } = createSerwistRoute({
  swSrc: 'src/app/sw.ts',
  useNativeEsbuild: true,
});

export { GET };
