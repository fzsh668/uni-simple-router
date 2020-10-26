import {
    uniNavApiRule,
    preloadPageRule,
    reNavMethodRule,
    reNotNavMethodRule,
    Router,
    rewriteMethodToggle,
    uniBackRule,
    routesMapRule,
    uniBackApiRule
} from '../options/base'

import {
    routesForMapRoute,
    getRoutePath,
    getDataType
} from '../helpers/utils'

import {
    warn
} from '../helpers/warn'

const rewrite: Array<reNavMethodRule|reNotNavMethodRule> = [
    'navigateTo',
    'redirectTo',
    'reLaunch',
    'switchTab',
    'navigateBack',
    'preloadPage'
];

export function rewriteMethod(
    router:Router
): void {
    if (router.options.keepUniOriginNav === false) {
        rewrite.forEach(name => {
            const oldMethod: Function = uni[name];
            uni[name] = function(params:uniNavApiRule|{from:string}):void {
                callRouterMethod(params, oldMethod, name, router);
            };
        })
    }
}
function callRouterMethod(
    option: uniNavApiRule|uniBackRule|preloadPageRule|uniBackApiRule,
    oldMethod:Function,
    funName:reNavMethodRule|reNotNavMethodRule,
    router:Router
): void {
    console.log(option);
    if (funName === 'reLaunch' && JSON.stringify(option) === '{"url":"/"}') {
        warn(
            `uni-app 原生方法：reLaunch({url:'/'}) 默认被重写啦！你可以使用 this.$Router.replaceAll() 或者 uni.reLaunch({url:'/?xxx=xxx'})`,
            router,
            true
        );
        funName = 'navigateBack';
        option = {
            from: 'backbutton'
        }
    }
    if (funName === 'navigateBack') {
        let level:number = 1;
        if (getDataType<number|undefined>((option as uniBackApiRule).delta) === '[object Number]') {
            level = ((option as uniBackApiRule).delta as number);
        }
        router.back(level, (option as uniBackRule|uniBackApiRule));
    } else if (funName === 'preloadPage') {
        router.preloadPage((option as preloadPageRule));
    } else {
        const routerMethodName = rewriteMethodToggle[(funName as reNavMethodRule)]
        let path = (option as uniNavApiRule).url;
        // eslint-disable-next-line no-unused-vars
        const {url, detail, ...navArgs} = (option as uniNavApiRule);
        if (funName === 'switchTab') {
            const detail = (option as uniNavApiRule).detail;
            path = '/' + (detail as {pagePath:string}).pagePath;
            const route = routesForMapRoute((router.routesMap as routesMapRule), path, ['pathMap', 'finallyPathList'])
            const {finallyPath} = getRoutePath(route);
            if (getDataType<string | string[]>(finallyPath) === '[object Array]') {
                warn(
                    `uni-app 原生方法跳转路径为：${path}。此路为是tab页面时，不允许设置 alias 为数组的情况，并且不能为动态路由！当然你可以通过通配符*解决！`,
                    router,
                    true
                );
            }
            if ((finallyPath as string) === '*') {
                warn(
                    `uni-app 原生方法跳转路径为：${path}。在路由表中找不到相关路由表！当然你可以通过通配符*解决！`,
                    router,
                    true
                );
            }
            path = (finallyPath as string);
        }
        router[routerMethodName]({
            path,
            ...navArgs
        })
    }
}