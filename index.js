import path from 'node:path';
import fs from 'node:fs/promises';
import Router from '@koa/router';

/**
 * 创建一个路由器实例，动态加载指定目录下的路由配置。
 *
 * @param routers_dir - 路由配置文件的目录路径（可以是相对路径或绝对路径）。
 * @param prefix - 可选参数，为所有路由路径添加统一的前缀（默认为空字符串）。
 * @returns  返回一个配置好的路由器实例。
 *
 * @remarks
 * - 函数会递归扫描指定目录下的所有文件，并动态加载它们作为路由配置。
 * - 每个路由文件需要导出 `path`、`methods` 和 `handlers` 属性。
 * - 路由路径会自动处理为以 `/` 开头，并统一使用 `/` 作为路径分隔符。
 * - 如果 `routers_dir` 是相对路径，会基于当前工作目录解析为绝对路径。
 * - 如果 `routers_dir` 为空字符串，则会使用当前工作目录作为默认值。
 * - 如果 `prefix` 为空字符串，则不会添加任何前缀。
 * - 如果 `prefix` 不为空字符串，则会为所有路由路径添加该前缀。
 * ``` javascript
 *...
 *const handler = async (ctx) => {
 *    const { resource, id } = ctx.params;
 *    // todo
 *    ctx.body = { code: 'OK', data: [] };
 *};
 *
 *export const path = ':resource/:id';
 *export const methods = ['delete'];
 *export const handlers = [handler];
 *
 *...
 * ```
 */
/**
 * 创建一个路由器实例，动态加载指定目录下的路由配置。
 *
 * @param routers_dir - 路由配置文件的目录路径（可以是相对路径或绝对路径）。
 * @param options - 可选配置选项
 * @param options.prefix - 为所有路由路径添加统一的前缀（默认为空字符串）。
 * @param options.fileExtensions - 要加载的文件扩展名数组（默认为 ['.js', '.ts']）。
 * @param options.ignorePatterns - 要忽略的文件模式正则表达式数组。
 * @returns 返回一个配置好的路由器实例。
 *
 * @throws {Error} 如果目录不存在或无法访问
 *
 * @remarks
 * - 函数会递归扫描指定目录下的所有文件，并动态加载它们作为路由配置。
 * - 每个路由文件需要导出 `path`、`methods` 和 `handlers` 属性。
 * - 路由路径会自动处理为以 `/` 开头，并统一使用 `/` 作为路径分隔符。
 */
export default async function (routers_dir, options = {}) {
    const { prefix = '', fileExtensions = ['.js', '.ts'], ignorePatterns = [] } = options;

    const absolute_path = path.isAbsolute(routers_dir) ? routers_dir : path.join(process.cwd(), routers_dir);

    // 检查目录是否存在
    try {
        await fs.access(absolute_path);
    } catch (error) {
        throw new Error(`路由目录不存在或无法访问: ${absolute_path}`);
    }

    let files = await fs.readdir(absolute_path, { withFileTypes: true, recursive: true });
    files = files.filter((p) => p.isFile() && fileExtensions.includes(path.extname(p.name)));
    files = files.map((p) => path.join(p.parentPath, p.name));
    // 应用忽略模式过滤
    const filteredFiles = files.filter((file) => !ignorePatterns.some((pattern) => pattern.test(file)));

    const router = new Router();

    for (const file of filteredFiles) {
        try {
            const pkg = (await import(file)).default;
            if (!pkg || !pkg.path || !pkg.methods || !pkg.handlers) {
                console.warn(`跳过无效的路由文件: ${file} - 缺少必要的导出属性`);
                continue;
            }

            pkg.path = path.join(prefix, path.relative(absolute_path, path.dirname(file)), pkg.path);
            pkg.path = pkg.path.replaceAll('\\', '/');
            pkg.path = pkg.path.startsWith('/') ? pkg.path : '/' + pkg.path;
            router.register(pkg.path, pkg.methods, ...pkg.handlers);
        } catch (error) {
            console.warn(`加载路由文件失败: ${file}`, error.message);
            continue;
        }
    }

    return router;
}
