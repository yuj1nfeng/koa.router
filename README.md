# Koa Router Loader

一个用于 Koa.js 的智能路由加载器，支持异步文件操作、文件过滤和错误处理。

## 特性

-   ✅ **异步文件操作** - 使用 `fs/promises` 进行非阻塞的文件系统操作
-   ✅ **智能文件过滤** - 支持文件扩展名过滤和正则表达式忽略模式
-   ✅ **错误处理** - 完善的错误检查和友好的错误提示
-   ✅ **路径处理** - 自动处理路径前缀和 Windows/Unix 路径兼容性
-   ✅ **类型安全** - 完整的 JSDoc 注释和类型提示

## 安装

```bash
npm install krloader
# 或
yarn add krloader
```

## 基本用法

### 路由文件格式

每个路由文件需要导出以下属性：

```javascript
// ./routes/user.login.js
const handler = async (ctx) => {
    const { username, password } = ctx.request.body;
    // 处理登录逻辑
    ctx.body = { success: true, message: '登录成功' };
};

const path = '/login';
const methods = ['post'];
const handlers = [handler];
export default { path, methods, handlers };
```

```javascript
// ./routes/resource.find.js
import authMiddleware from './middleware/auth.js';
import validationMiddleware from './middleware/validation.js';

const handler = async (ctx) => {
    const { id } = ctx.params;
    // 获取资源逻辑
    ctx.body = { id, name: '示例资源' };
};

const path = '/resource/:id';
const methods = ['get'];
const handlers = [authMiddleware, validationMiddleware, handler];
export default { path, methods, handlers };
```

### 加载路由

```javascript
import Koa from 'koa';
import loadRouters from 'krloader';

const app = new Koa();

// 基本用法
const router = await loadRouters('./routes', {
    prefix: '/api',
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});
```

## 高级用法

### 文件过滤

```javascript
// 只加载 .js 文件，忽略 .test.js 文件
const router = await loadRouters('./routes', {
    prefix: '/api',
    fileExtensions: ['.js'],
    ignorePatterns: [/\.test\.js$/],
});
```

### 错误处理

```javascript
try {
    const router = await loadRouters('./routes', {
        prefix: '/api',
    });
    app.use(router.routes()).use(router.allowedMethods());
} catch (error) {
    console.error('路由加载失败:', error.message);
    process.exit(1);
}
```

## API

### `loadRouters(routers_dir, options)`

-   `routers_dir` (string): 路由文件目录路径
-   `options` (object): 配置选项
    -   `prefix` (string): 路由前缀，默认为空字符串
    -   `fileExtensions` (string[]): 要加载的文件扩展名，默认为 `['.js', '.ts']`
    -   `ignorePatterns` (RegExp[]): 要忽略的文件模式正则表达式数组

返回一个配置好的 Koa Router 实例。

## 路由结构

加载后的路由结构示例：

```bash
[POST]    /api/login
[GET]     /api/resource/:id
[POST]    /api/v1/resource
[DELETE]  /api/v1/resource
```

## 开发

### 测试

```bash
# 运行测试
npm test
```

### 构建

```bash
# 构建项目
npm run build
```

## 许可证

MIT License
