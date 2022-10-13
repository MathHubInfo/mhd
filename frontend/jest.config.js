const nextJest = require("next/jest")
const path = require("path")

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    // Add more setup options before each test is run
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
    moduleDirectories: ["node_modules", "<rootDir>/"],
    testEnvironment: "jest-environment-jsdom",
    testPathIgnorePatterns: ["vendor"],
}
const config = createJestConfig(customJestConfig)

// read the typescript paths
const tspaths = require("./tsconfig.json").compilerOptions.paths

// turn them into jest mappings
const moduleNameMapper = {}
Object.entries(tspaths).forEach(([name, alias]) => {
  if(alias.length != 1) return
  moduleNameMapper["^" + name + "$"] = path.resolve(__dirname, alias[0])
})

const newConfig = async () => {
    const cfg = await config()
    cfg.moduleNameMapper = { ...cfg.moduleNameMapper, ...moduleNameMapper }
    return cfg
}


// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = newConfig