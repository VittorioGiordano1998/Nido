module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'refactor', 'perf', 'docs', 'test', 'chore', 'build', 'ci', 'style', 'revert'],
        ],
        'scope-enum': [
            1, // warning only — scopes evolve with the codebase; extend this list
            // as the project defines its areas (addons ship example scope lists)
            'always',
            [
                'app', 'supabase', 'docs', 'ci', 'repo',
            ],
        ],
        'subject-case': [0],
        'header-max-length': [2, 'always', 100],
    },
};
