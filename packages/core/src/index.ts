export type {
  AspectRatio,
  SceneAssets,
  SceneMotion,
  SceneReview,
  SceneStatus,
  StoryProject,
  StoryScene,
  StorySource,
  StoryStyle,
  ValidationResult
} from "./schema.js";

export {
  createStarterStoryProject,
  parseStoryYaml,
  readStoryProject,
  stringifyStoryProject,
  validateStoryProject
} from "./schema.js";

export type {
  LoadedTemplate,
  StoryVideoTemplate,
  TemplateClass,
  TemplateSearchDir,
  TemplateValidationResult
} from "./template.js";

export {
  TEMPLATE_CLASSES,
  TEMPLATE_FILE_NAME,
  createStarterTemplate,
  findTemplate,
  findTemplateRecord,
  loadTemplateRecords,
  loadTemplateRecordsFromDir,
  loadTemplates,
  stringifyTemplate,
  validateTemplate,
  validateTemplateFile
} from "./template.js";

export type {
  ManifestAsset,
  PublishPack,
  SceneAssetKind,
  SplitScriptOptions,
  StoryManifest
} from "./workspace.js";

export {
  createPublishPack,
  createScenesFromScript,
  createStoryManifest,
  defaultManifestPath,
  defaultPackageListPath,
  defaultPublishPath,
  defaultScenesJsonPath,
  defaultScriptPath,
  projectDirFromStoryPath,
  replaceProjectScenes,
  sceneAssetRelativePath,
  sha256Bytes,
  updateSceneAsset
} from "./workspace.js";
