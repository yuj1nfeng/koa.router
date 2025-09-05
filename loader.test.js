import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import loadRouters from './index.js';

const testDir = path.join(process.cwd(), 'test_routers');

// 创建测试路由文件
async function createTestRoutes() {
    await fs.mkdir(testDir, { recursive: true });

    // 创建测试路由文件
    await fs.writeFile(
        path.join(testDir, 'user.login.js'),
        `
const handler = async (ctx) => {
    ctx.body = { success: true, message: 'login' };
};

const path = '/login';
const methods = ['post'];
const handlers = [handler];
export default {path,methods,handlers};
`
    );

    await fs.writeFile(
        path.join(testDir, 'resource.get.js'),
        `
const handler = async (ctx) => {
    const { id } = ctx.params;
    ctx.body = { id, name: 'resource' };
};

const path = '/resource/:id';
const methods = ['get'];
const handlers = [handler];

export default {path,methods,handlers};
`
    );

    await fs.writeFile(
        path.join(testDir, 'resource.create.js'),
        `
const handler = async (ctx) => {
    ctx.body = { success: true, message: 'created' };
};

const path = '/resource';
const methods = ['post'];
const handlers = [handler];

export default {path,methods,handlers};
`
    );
    await fs.writeFile(
        path.join(testDir, 'resource.delete.ts'),
        `
const handler = async (ctx) => {
    ctx.body = { success: true, message: 'created' };
};

const path = '/resource/:id';
const methods = ['delete'];
const handlers = [handler];

export default {path,methods,handlers};
`
    );

    // 创建测试忽略文件
    await fs.writeFile(
        path.join(testDir, 'ignore.test.js'),
        `
const handler = async (ctx) => {
    ctx.body = { ignored: true };
};

const path = '/ignore';
const methods = ['get'];
const handlers = [handler];

export default {path,methods,handlers};
`
    );
}

// 清理测试文件
async function cleanupTestRoutes() {
    try {
        await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
        // 忽略清理错误
    }
}

describe('Koa Router Loader', () => {
    beforeEach(async () => {
        await cleanupTestRoutes();
        await createTestRoutes();
    });

    afterEach(async () => {
        await cleanupTestRoutes();
    });

    test('应该加载所有路由文件', async () => {
        const router = await loadRouters(testDir);
        expect(router).toBeDefined();

        const routes = router.stack;
        expect(routes.length).toBe(5);
    });

    test('应该支持文件扩展名过滤', async () => {
        const router = await loadRouters(testDir, {
            fileExtensions: ['.js'],
        });

        const routes = router.stack;
        expect(routes.length).toBe(4);
    });

    test('应该支持忽略模式过滤', async () => {
        const router = await loadRouters(testDir, {
            ignorePatterns: [/\.test\.js$/],
        });

        const routes = router.stack;
        expect(routes.length).toBe(4); // 应该忽略 ignore.test.js
    });

    test('应该处理不存在的目录', async () => {
        await expect(loadRouters('/non/existent/directory')).rejects.toThrow();
    });

    test('应该支持路由前缀', async () => {
        const router = await loadRouters(testDir, {
            prefix: '/api',
        });

        const routes = router.stack;
        expect(routes.length).toBe(5);

        // 检查路由路径是否包含前缀
        routes.forEach((route) => {
            expect(route.path).toMatch(/^\/api\//);
        });
    });
});
