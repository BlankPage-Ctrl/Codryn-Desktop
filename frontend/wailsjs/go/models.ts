export namespace attachments {
	
	export class AttachmentMeta {
	    id: string;
	    workspaceId: string;
	    originalFilename: string;
	    storedFilename: string;
	    mediaType: string;
	    sizeBytes: number;
	    status: string;
	    createdAt: string;
	    expiresAt?: string;
	
	    static createFrom(source: any = {}) {
	        return new AttachmentMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.workspaceId = source["workspaceId"];
	        this.originalFilename = source["originalFilename"];
	        this.storedFilename = source["storedFilename"];
	        this.mediaType = source["mediaType"];
	        this.sizeBytes = source["sizeBytes"];
	        this.status = source["status"];
	        this.createdAt = source["createdAt"];
	        this.expiresAt = source["expiresAt"];
	    }
	}
	export class PickedImage {
	    filename: string;
	    mediaType: string;
	    dataBase64: string;
	    sizeBytes: number;
	
	    static createFrom(source: any = {}) {
	        return new PickedImage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.mediaType = source["mediaType"];
	        this.dataBase64 = source["dataBase64"];
	        this.sizeBytes = source["sizeBytes"];
	    }
	}
	export class UploadResult {
	    attachment: AttachmentMeta;
	
	    static createFrom(source: any = {}) {
	        return new UploadResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.attachment = this.convertValues(source["attachment"], AttachmentMeta);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace categories {
	
	export class Category {
	    id: string;
	    name: string;
	    color?: string;
	    is_default: boolean;
	    created_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.color = source["color"];
	        this.is_default = source["is_default"];
	        this.created_at = source["created_at"];
	    }
	}
	export class CategoryDto {
	    name: string;
	    color?: string;
	
	    static createFrom(source: any = {}) {
	        return new CategoryDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.color = source["color"];
	    }
	}

}

export namespace chats {
	
	export class Chat {
	    id: string;
	    title: string;
	    providerId?: string;
	    modelId?: string;
	    systemPrompt?: string;
	    thinkingMode: string;
	    mode: string;
	    workspaceId: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Chat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.providerId = source["providerId"];
	        this.modelId = source["modelId"];
	        this.systemPrompt = source["systemPrompt"];
	        this.thinkingMode = source["thinkingMode"];
	        this.mode = source["mode"];
	        this.workspaceId = source["workspaceId"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ChatDto {
	    title: string;
	    modelId?: string;
	    providerId?: string;
	    systemPrompt?: string;
	    thinkingMode?: string;
	    mode?: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.title = source["title"];
	        this.modelId = source["modelId"];
	        this.providerId = source["providerId"];
	        this.systemPrompt = source["systemPrompt"];
	        this.thinkingMode = source["thinkingMode"];
	        this.mode = source["mode"];
	    }
	}

}

export namespace files {
	
	export class FileMeta {
	    isSymlink: boolean;
	    symlinkTarget?: string;
	
	    static createFrom(source: any = {}) {
	        return new FileMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isSymlink = source["isSymlink"];
	        this.symlinkTarget = source["symlinkTarget"];
	    }
	}
	export class FileNode {
	    id: string;
	    name: string;
	    path: string;
	    type: string;
	    isDirectory: boolean;
	    size?: number;
	    lastModified?: number;
	    hasChildren?: boolean;
	    children?: FileNode[];
	    meta?: FileMeta;
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	        this.type = source["type"];
	        this.isDirectory = source["isDirectory"];
	        this.size = source["size"];
	        this.lastModified = source["lastModified"];
	        this.hasChildren = source["hasChildren"];
	        this.children = this.convertValues(source["children"], FileNode);
	        this.meta = this.convertValues(source["meta"], FileMeta);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GetStatData {
	    node: FileNode;
	
	    static createFrom(source: any = {}) {
	        return new GetStatData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.node = this.convertValues(source["node"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ListDirData {
	    requestedPath: string;
	    nodes: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new ListDirData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.requestedPath = source["requestedPath"];
	        this.nodes = this.convertValues(source["nodes"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ReadFileData {
	    path: string;
	    content: string;
	    encoding: string;
	    size: number;
	    truncated: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ReadFileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.content = source["content"];
	        this.encoding = source["encoding"];
	        this.size = source["size"];
	        this.truncated = source["truncated"];
	    }
	}
	export class SearchFilesData {
	    query: string;
	    matches: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new SearchFilesData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.matches = this.convertValues(source["matches"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace hitl {
	
	export class HitlRequest {
	    id: string;
	    type: string;
	    title: string;
	    description?: string;
	    correlationId?: string;
	    workspaceId?: string;
	    chatId?: string;
	    executionId?: string;
	    metadata: Record<string, any>;
	    status: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	    // Go type: time
	    expiresAt?: any;
	    // Go type: time
	    resolvedAt?: any;
	    payload: number[];
	    response: number[];
	
	    static createFrom(source: any = {}) {
	        return new HitlRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.correlationId = source["correlationId"];
	        this.workspaceId = source["workspaceId"];
	        this.chatId = source["chatId"];
	        this.executionId = source["executionId"];
	        this.metadata = source["metadata"];
	        this.status = source["status"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	        this.expiresAt = this.convertValues(source["expiresAt"], null);
	        this.resolvedAt = this.convertValues(source["resolvedAt"], null);
	        this.payload = source["payload"];
	        this.response = source["response"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace insight {
	
	export class IndexStatus {
	    syncing: boolean;
	    pending: number;
	    requiresFull: boolean;
	
	    static createFrom(source: any = {}) {
	        return new IndexStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.syncing = source["syncing"];
	        this.pending = source["pending"];
	        this.requiresFull = source["requiresFull"];
	    }
	}
	export class SearchHit {
	    id: string;
	    name: string;
	    kind: string;
	    filePath: string;
	    // Go type: struct { Start int "json:\"start\""; End int "json:\"end\"" }
	    lineRange: any;
	
	    static createFrom(source: any = {}) {
	        return new SearchHit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.kind = source["kind"];
	        this.filePath = source["filePath"];
	        this.lineRange = this.convertValues(source["lineRange"], Object);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchParams {
	    query: string;
	    mode?: string;
	    limit?: number;
	    file?: string;
	    container?: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchParams(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.mode = source["mode"];
	        this.limit = source["limit"];
	        this.file = source["file"];
	        this.container = source["container"];
	    }
	}
	export class SearchResult {
	    query: string;
	    hits: SearchHit[];
	    stats: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.query = source["query"];
	        this.hits = this.convertValues(source["hits"], SearchHit);
	        this.stats = source["stats"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Status {
	    workspaceId: string;
	    enabled: boolean;
	    running: boolean;
	    projectPath: string;
	
	    static createFrom(source: any = {}) {
	        return new Status(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspaceId = source["workspaceId"];
	        this.enabled = source["enabled"];
	        this.running = source["running"];
	        this.projectPath = source["projectPath"];
	    }
	}
	export class SyncResult {
	    filesChecked: number;
	    added: number;
	    modified: number;
	    removed: number;
	
	    static createFrom(source: any = {}) {
	        return new SyncResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filesChecked = source["filesChecked"];
	        this.added = source["added"];
	        this.modified = source["modified"];
	        this.removed = source["removed"];
	    }
	}

}

export namespace mcp {
	
	export class ServerState {
	    name: string;
	    transport: string;
	    enabled: boolean;
	    status: string;
	    tools: number;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new ServerState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.transport = source["transport"];
	        this.enabled = source["enabled"];
	        this.status = source["status"];
	        this.tools = source["tools"];
	        this.error = source["error"];
	    }
	}
	export class ListResult {
	    workspaceId: string;
	    source: string;
	    servers: ServerState[];
	
	    static createFrom(source: any = {}) {
	        return new ListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspaceId = source["workspaceId"];
	        this.source = source["source"];
	        this.servers = this.convertValues(source["servers"], ServerState);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class SetResult {
	    workspaceId: string;
	    server: ServerState;
	
	    static createFrom(source: any = {}) {
	        return new SetResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.workspaceId = source["workspaceId"];
	        this.server = this.convertValues(source["server"], ServerState);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace messages {
	
	export class FileConflictWriter {
	    chatId: string;
	    messageId: string;
	    createdAt: string;
	
	    static createFrom(source: any = {}) {
	        return new FileConflictWriter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.chatId = source["chatId"];
	        this.messageId = source["messageId"];
	        this.createdAt = source["createdAt"];
	    }
	}
	export class FileConflict {
	    path: string;
	    reason: string;
	    expectedHash?: string;
	    currentHash?: string;
	    lastWriter?: FileConflictWriter;
	
	    static createFrom(source: any = {}) {
	        return new FileConflict(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.reason = source["reason"];
	        this.expectedHash = source["expectedHash"];
	        this.currentHash = source["currentHash"];
	        this.lastWriter = this.convertValues(source["lastWriter"], FileConflictWriter);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class FileRestoreItem {
	    path: string;
	    op: string;
	
	    static createFrom(source: any = {}) {
	        return new FileRestoreItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.op = source["op"];
	    }
	}
	export class FileRestore {
	    restored: FileRestoreItem[];
	    conflicts: FileConflict[];
	
	    static createFrom(source: any = {}) {
	        return new FileRestore(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.restored = this.convertValues(source["restored"], FileRestoreItem);
	        this.conflicts = this.convertValues(source["conflicts"], FileConflict);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RevertFilePlan {
	    path: string;
	    op: string;
	    status: string;
	    reason?: string;
	    expectedHash?: string;
	    currentHash?: string;
	    lastWriter?: FileConflictWriter;
	    diffPreview?: string;
	
	    static createFrom(source: any = {}) {
	        return new RevertFilePlan(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.op = source["op"];
	        this.status = source["status"];
	        this.reason = source["reason"];
	        this.expectedHash = source["expectedHash"];
	        this.currentHash = source["currentHash"];
	        this.lastWriter = this.convertValues(source["lastWriter"], FileConflictWriter);
	        this.diffPreview = source["diffPreview"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PreviewResult {
	    targetMessageId: string;
	    fromPosition: number;
	    suffixIds: string[];
	    files: RevertFilePlan[];
	
	    static createFrom(source: any = {}) {
	        return new PreviewResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.targetMessageId = source["targetMessageId"];
	        this.fromPosition = source["fromPosition"];
	        this.suffixIds = source["suffixIds"];
	        this.files = this.convertValues(source["files"], RevertFilePlan);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class RevertResult {
	    deletedMessageIds: string[];
	    cancelledRunIds: string[];
	    fileRestore?: FileRestore;
	
	    static createFrom(source: any = {}) {
	        return new RevertResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.deletedMessageIds = source["deletedMessageIds"];
	        this.cancelledRunIds = source["cancelledRunIds"];
	        this.fileRestore = this.convertValues(source["fileRestore"], FileRestore);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class Model {
	    id: string;
	    modelId: string;
	    displayName?: string;
	    providerId: string;
	    maxInputTokens?: number;
	    maxOutputTokens?: number;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	        this.providerId = source["providerId"];
	        this.maxInputTokens = source["maxInputTokens"];
	        this.maxOutputTokens = source["maxOutputTokens"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class ModelDto {
	    modelId: string;
	    displayName?: string;
	    maxInputTokens?: number;
	    maxOutputTokens?: number;
	
	    static createFrom(source: any = {}) {
	        return new ModelDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	        this.maxInputTokens = source["maxInputTokens"];
	        this.maxOutputTokens = source["maxOutputTokens"];
	    }
	}

}

export namespace notes {
	
	export class MovePosition {
	    before?: string;
	    after?: string;
	
	    static createFrom(source: any = {}) {
	        return new MovePosition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.before = source["before"];
	        this.after = source["after"];
	    }
	}
	export class Note {
	    id: string;
	    name: string;
	    category_id: string;
	    desc: string;
	    details: string;
	    rank: string;
	    priority: string;
	    created_at: string;
	    updated_at: string;
	    version: number;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category_id = source["category_id"];
	        this.desc = source["desc"];
	        this.details = source["details"];
	        this.rank = source["rank"];
	        this.priority = source["priority"];
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	        this.version = source["version"];
	    }
	}
	export class NoteDto {
	    name: string;
	    category_id?: string;
	    desc?: string;
	    details?: string;
	    priority?: string;
	
	    static createFrom(source: any = {}) {
	        return new NoteDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.category_id = source["category_id"];
	        this.desc = source["desc"];
	        this.details = source["details"];
	        this.priority = source["priority"];
	    }
	}

}

export namespace providers {
	
	export class ProviderModel {
	    id: string;
	    modelId: string;
	    displayName?: string;
	    providerId: string;
	    maxInputTokens?: number;
	    maxOutputTokens?: number;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.modelId = source["modelId"];
	        this.displayName = source["displayName"];
	        this.providerId = source["providerId"];
	        this.maxInputTokens = source["maxInputTokens"];
	        this.maxOutputTokens = source["maxOutputTokens"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class Provider {
	    id: string;
	    name: string;
	    type: string;
	    apiKey?: string;
	    baseURL?: string;
	    models: ProviderModel[];
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Provider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.apiKey = source["apiKey"];
	        this.baseURL = source["baseURL"];
	        this.models = this.convertValues(source["models"], ProviderModel);
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProviderDto {
	    name: string;
	    type: string;
	    apiKey?: string;
	    baseURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new ProviderDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.type = source["type"];
	        this.apiKey = source["apiKey"];
	        this.baseURL = source["baseURL"];
	    }
	}
	
	export class ProviderType {
	    id: string;
	    label: string;
	    isOfficial: boolean;
	    requiresBaseURL: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProviderType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.label = source["label"];
	        this.isOfficial = source["isOfficial"];
	        this.requiresBaseURL = source["requiresBaseURL"];
	    }
	}

}

export namespace settings {
	
	export class DefaultProvider {
	    providerId?: string;
	    modelId?: string;
	
	    static createFrom(source: any = {}) {
	        return new DefaultProvider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.providerId = source["providerId"];
	        this.modelId = source["modelId"];
	    }
	}
	export class SettingValue {
	    key: string;
	    value?: string;
	
	    static createFrom(source: any = {}) {
	        return new SettingValue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}

}

export namespace stream {
	
	export class RunInfo {
	    runId: string;
	    chatId: string;
	    workspaceId: string;
	    assistantMessageId: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new RunInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.runId = source["runId"];
	        this.chatId = source["chatId"];
	        this.workspaceId = source["workspaceId"];
	        this.assistantMessageId = source["assistantMessageId"];
	        this.status = source["status"];
	    }
	}
	export class StartRunResult {
	    runId: string;
	    assistantMessageId: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new StartRunResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.runId = source["runId"];
	        this.assistantMessageId = source["assistantMessageId"];
	        this.status = source["status"];
	    }
	}

}

export namespace workspaces {
	
	export class Workspace {
	    id: string;
	    name: string;
	    description?: string;
	    projectPath: string;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new Workspace(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.projectPath = source["projectPath"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class WorkspaceDto {
	    name: string;
	    description?: string;
	    projectPath: string;
	
	    static createFrom(source: any = {}) {
	        return new WorkspaceDto(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.projectPath = source["projectPath"];
	    }
	}

}

