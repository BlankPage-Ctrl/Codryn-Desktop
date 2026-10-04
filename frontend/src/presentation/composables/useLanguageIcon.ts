export const LANGUAGE_ICON_MAP: Record<string, string> = {
    // JS/TS ecosystem
    js: 'devicon:javascript',
    javascript: 'devicon:javascript',
    mjs: 'devicon:javascript',
    cjs: 'devicon:javascript',
    ts: 'devicon:typescript',
    typescript: 'devicon:typescript',
    mts: 'devicon:typescript',
    cts: 'devicon:typescript',
    jsx: 'devicon:react',
    tsx: 'devicon:react',
    vue: 'devicon:vuejs',
    svelte: 'devicon:svelte',
    astro: 'devicon:astro',
    angular: 'devicon:angular',
    nextjs: 'devicon:nextjs',
    nuxtjs: 'devicon:nuxtjs',
    nodejs: 'devicon:nodejs',
    node: 'devicon:nodejs',
    deno: 'devicon:denojs',
    bun: 'devicon:bun',
    vite: 'devicon:vite',
    webpack: 'devicon:webpack',
    react: 'devicon:react',

    // HTML/CSS
    html: 'devicon:html5',
    html5: 'devicon:html5',
    css: 'devicon:css3',
    css3: 'devicon:css3',
    scss: 'devicon:sass',
    sass: 'devicon:sass',
    less: 'devicon:less',
    tailwind: 'devicon:tailwindcss',
    tailwindcss: 'devicon:tailwindcss',

    // OTHER LANGUAGES
    py: 'devicon:python',
    python: 'devicon:python',
    go: 'devicon:go',
    golang: 'devicon:go',
    rs: 'devicon:rust',
    rust: 'devicon:rust',
    java: 'devicon:java',
    kotlin: 'devicon:kotlin',
    php: 'devicon:php',
    rb: 'devicon:ruby',
    ruby: 'devicon:ruby',
    swift: 'devicon:swift',
    dart: 'devicon:dart',
    lua: 'devicon:lua',
    perl: 'devicon:perl',
    r: 'devicon:r',
    c: 'devicon:c',
    cpp: 'devicon:cplusplus',
    'c++': 'devicon:cplusplus',
    cplusplus: 'devicon:cplusplus',
    csharp: 'devicon:csharp',
    'c#': 'devicon:csharp',
    cs: 'devicon:csharp',
    scala: 'devicon:scala',
    clojure: 'devicon:clojure',
    haskell: 'devicon:haskell',
    elixir: 'devicon:elixir',
    ocaml: 'devicon:ocaml',
    nim: 'devicon:nim',
    zig: 'devicon:zig',
    solidity: 'devicon:solidity',
    matlab: 'devicon:matlab',
    julia: 'devicon:julia',

    // Shell
    sh: 'devicon:bash',
    shell: 'devicon:bash',
    bash: 'devicon:bash',
    zsh: 'devicon:bash',
    fish: 'devicon:bash',
    powershell: 'devicon:powershell',

    // Data / config
    json: 'devicon:json',
    yaml: 'devicon:yaml',
    yml: 'devicon:yaml',
    toml: 'devicon:toml',
    xml: 'devicon:xml',
    markdown: 'devicon:markdown',
    md: 'devicon:markdown',
    mdx: 'devicon:markdown',

    // DB
    sql: 'devicon:azuresqldatabase',
    mysql: 'devicon:mysql',
    postgresql: 'devicon:postgresql',
    postgres: 'devicon:postgresql',
    sqlite: 'devicon:sqlite',
    mongodb: 'devicon:mongodb',
    redis: 'devicon:redis',

    // Infra
    docker: 'devicon:docker',
    dockerfile: 'devicon:docker',
    kubernetes: 'devicon:kubernetes',
    k8s: 'devicon:kubernetes',
    terraform: 'devicon:terraform',
    ansible: 'devicon:ansible',
    nginx: 'devicon:nginx',
    graphql: 'devicon:apollographql',

    // Misc
    prisma: 'devicon:prisma',
    django: 'devicon:django',
    flask: 'devicon:flask',
    spring: 'devicon:spring',
    laravel: 'devicon:laravel',
    rails: 'devicon:rails',
}

export const DEFAULT_LANGUAGE_ICON = 'lucide:code-2'

export function getLanguageIcon(lang: string | undefined | null): string {
    if (!lang) return DEFAULT_LANGUAGE_ICON
    const key = lang.trim().toLowerCase()
    return LANGUAGE_ICON_MAP[key] ?? DEFAULT_LANGUAGE_ICON
}
