import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "node_modules/@octokit/graphql-schema/schema.graphql",
  documents: "src/github/queries.ts",
  generates: {
    "src/github/graphql.generated.ts": {
      plugins: ["typescript-operations"],
      config: {
        enumType: "string-literal",
        scalars: { DateTime: "string", URI: "string", HTML: "string" },
      },
    },
  },
};

export default config;
