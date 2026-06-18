/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ghim workspace root về đúng thư mục project.
  // Tránh việc Next/Turbopack tự suy ra root sai khi có package-lock.json
  // "lạc" ở thư mục cha (vd: /home/ngcoogiapw/package-lock.json) -> lỗi
  // "can't resolve 'tailwindcss'".
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
