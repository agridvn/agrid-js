/** @type {import('pnpm').Hooks} */
// Overrides agrid dependencies to local versions
module.exports = {
    hooks: {
        readPackage(pkg) {
            function rewriteLocalDeps(deps) {
                if (deps) {
                    for (const dep in deps) {
                        if (['@agrid/cli', 'agrid-react-native-session-replay'].includes(dep)) {
                            continue
                        }
                        if (dep.startsWith('agrid') || dep.startsWith('@agrid')) {
                            const tarballName = dep.replace('@', '').replace('/', '-')
                            deps[dep] = `file:../../target/${tarballName}.tgz`
                        }
                    }
                }
            }

            rewriteLocalDeps(pkg.dependencies)
            rewriteLocalDeps(pkg.devDependencies)
            rewriteLocalDeps(pkg.optionalDependencies)

            return pkg
        },
        updateConfig(config) {
            return Object.assign(config, {
                lockfile: false,
                packages: ['.'],
                preferFrozenLockfile: false,
                verifyDepsBeforeRun: true,
                nodeLinker: 'hoisted',
            })
        },
    },
}
