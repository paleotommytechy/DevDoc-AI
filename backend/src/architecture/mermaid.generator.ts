import { ProjectEntity } from "../services/db.service";

/**
 * Utility to clean strings so they can be used as valid Mermaid node IDs.
 */
function toNodeId(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "_");
}

export class MermaidGenerator {
  /**
   * 1. Project Folder Tree
   */
  static generateFolderTree(project: ProjectEntity, endpoints: any[]): string {
    // Gather all source files
    const filePaths = new Set<string>();
    
    // Add routes discovered sourceFiles
    if (project.routes_discovered && Array.isArray(project.routes_discovered)) {
      project.routes_discovered.forEach((r: any) => {
        if (r.sourceFile) filePaths.add(r.sourceFile);
      });
    }

    // Add endpoints source files
    endpoints.forEach((ep) => {
      if (ep.source_file) filePaths.add(ep.source_file);
    });

    // Fallbacks if no source files were parsed
    if (filePaths.size === 0) {
      filePaths.add("src/app.ts");
      filePaths.add("src/routes/index.ts");
      filePaths.add("src/controllers/index.ts");
      filePaths.add("src/services/index.ts");
    }

    // Build hierarchical trie of directories and files
    const root: any = { name: "root", children: {} };

    filePaths.forEach((filePath) => {
      const parts = filePath.replace(/\\/g, "/").split("/");
      let current = root;
      parts.forEach((part) => {
        if (!part) return;
        if (!current.children[part]) {
          current.children[part] = { name: part, children: {} };
        }
        current = current.children[part];
      });
    });

    // Generate Mermaid graph syntax from trie
    let lines: string[] = ["graph TD", "  %% Styling definitions", "  classDef folder fill:#ffeaa7,stroke:#fdcb6e,stroke-width:2px,color:#2d3436;", "  classDef file fill:#dfe6e9,stroke:#b2bec3,stroke-width:1px,color:#2d3436;"];
    let nodeCounter = 0;

    function traverse(node: any, parentId: string | null) {
      const currentId = `n_${nodeCounter++}`;
      const isFile = Object.keys(node.children).length === 0;
      const displayName = isFile ? `📄 ${node.name}` : `📁 ${node.name}`;
      
      lines.push(`  ${currentId}["${displayName}"]`);
      lines.push(`  class ${currentId} ${isFile ? "file" : "folder"};`);

      if (parentId) {
        lines.push(`  ${parentId} --> ${currentId}`);
      }

      Object.keys(node.children).forEach((key) => {
        traverse(node.children[key], currentId);
      });
    }

    // Start traversal for each top level element in the trie
    const topKeys = Object.keys(root.children);
    if (topKeys.length === 1) {
      // Just one top level (usually src or backend/frontend)
      traverse(root.children[topKeys[0]], null);
    } else {
      // Multiple roots
      const rootId = "n_root";
      lines.push(`  ${rootId}["📁 ${project.name || 'project-root'}"]`);
      lines.push(`  class ${rootId} folder;`);
      topKeys.forEach((key) => {
        const topNode = root.children[key];
        const currentId = `n_${nodeCounter++}`;
        const isFile = Object.keys(topNode.children).length === 0;
        const displayName = isFile ? `📄 ${topNode.name}` : `📁 ${topNode.name}`;
        
        lines.push(`  ${currentId}["${displayName}"]`);
        lines.push(`  class ${currentId} ${isFile ? "file" : "folder"};`);
        lines.push(`  ${rootId} --> ${currentId}`);

        Object.keys(topNode.children).forEach((subKey) => {
          traverse(topNode.children[subKey], currentId);
        });
      });
    }

    return lines.join("\n");
  }

  /**
   * 2. Route → Controller Relationships
   */
  static generateRouteController(endpoints: any[]): string {
    if (endpoints.length === 0) {
      return `graph LR
  empty["No Routes found in Project Scanner. Upload a zip containing Express routes to populate."]`;
    }

    let lines: string[] = [
      "graph LR",
      "  %% Styling definitions",
      "  classDef get fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;",
      "  classDef post fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;",
      "  classDef put fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100;",
      "  classDef delete fill:#ffebee,stroke:#d32f2f,stroke-width:2px,color:#b71c1c;",
      "  classDef other fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;",
      "  classDef controller fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;"
    ];

    const controllerNodes = new Set<string>();

    endpoints.forEach((ep, index) => {
      const cleanRoute = ep.route || "/";
      const method = (ep.method || "GET").toUpperCase();
      const controller = ep.controller || "anonymousHandler";

      const routeNodeId = `route_${index}`;
      const controllerNodeId = `ctrl_${toNodeId(controller)}`;

      // Style route node based on HTTP Method
      let methodClass = "other";
      if (method === "GET") methodClass = "get";
      else if (method === "POST") methodClass = "post";
      else if (method === "PUT" || method === "PATCH") methodClass = "put";
      else if (method === "DELETE") methodClass = "delete";

      lines.push(`  ${routeNodeId}["${method} ${cleanRoute}"]`);
      lines.push(`  class ${routeNodeId} ${methodClass};`);

      if (!controllerNodes.has(controllerNodeId)) {
        lines.push(`  ${controllerNodeId}["⚙️ ${controller}"]`);
        lines.push(`  class ${controllerNodeId} controller;`);
        controllerNodes.add(controllerNodeId);
      }

      lines.push(`  ${routeNodeId} --> ${controllerNodeId}`);
    });

    return lines.join("\n");
  }

  /**
   * 3. Controller → Service Relationships
   */
  static generateControllerService(endpoints: any[]): string {
    if (endpoints.length === 0) {
      return `graph LR
  empty["No controller relationships parsed. Ensure you have router handlers connected to controller classes."]`;
    }

    let lines: string[] = [
      "graph LR",
      "  %% Styling definitions",
      "  classDef controller fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;",
      "  classDef service fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#1a237e;"
    ];

    const mappedConnections = new Set<string>();
    const controllerNodes = new Set<string>();
    const serviceNodes = new Set<string>();

    endpoints.forEach((ep) => {
      const controller = ep.controller || "anonymousHandler";
      const route = ep.route || "";
      
      const controllerNodeId = `ctrl_${toNodeId(controller)}`;
      
      // Derive service name
      let serviceName = "DefaultService";
      const parts = controller.split(".");
      const controllerClass = parts[0] || controller;

      if (controllerClass.toLowerCase().endsWith("controller")) {
        const base = controllerClass.slice(0, -10);
        serviceName = base.charAt(0).toUpperCase() + base.slice(1) + "Service";
      } else {
        serviceName = controllerClass.charAt(0).toUpperCase() + controllerClass.slice(1) + "Service";
      }

      const serviceNodeId = `srv_${toNodeId(serviceName)}`;
      const connectionId = `${controllerNodeId}-->${serviceNodeId}`;

      if (!controllerNodes.has(controllerNodeId)) {
        lines.push(`  ${controllerNodeId}["⚙️ ${controller}"]`);
        lines.push(`  class ${controllerNodeId} controller;`);
        controllerNodes.add(controllerNodeId);
      }

      if (!serviceNodes.has(serviceNodeId)) {
        lines.push(`  ${serviceNodeId}["🛠️ ${serviceName}"]`);
        lines.push(`  class ${serviceNodeId} service;`);
        serviceNodes.add(serviceNodeId);
      }

      if (!mappedConnections.has(connectionId)) {
        lines.push(`  ${controllerNodeId} --> ${serviceNodeId}`);
        mappedConnections.add(connectionId);
      }
    });

    return lines.join("\n");
  }

  /**
   * 4. Service → Database Relationships
   */
  static generateServiceDatabase(project: ProjectEntity, endpoints: any[]): string {
    const dbType = project.database || "PostgreSQL";
    let lines: string[] = [
      "graph LR",
      "  %% Styling definitions",
      "  classDef service fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#1a237e;",
      "  classDef table fill:#efebe9,stroke:#5d4037,stroke-width:2px,color:#3e2723;"
    ];

    const services = new Set<string>();
    endpoints.forEach((ep) => {
      const controller = ep.controller || "anonymousHandler";
      let serviceName = "DefaultService";
      const parts = controller.split(".");
      const controllerClass = parts[0] || controller;

      if (controllerClass.toLowerCase().endsWith("controller")) {
        const base = controllerClass.slice(0, -10);
        serviceName = base.charAt(0).toUpperCase() + base.slice(1) + "Service";
      } else {
        serviceName = controllerClass.charAt(0).toUpperCase() + controllerClass.slice(1) + "Service";
      }
      services.add(serviceName);
    });

    if (services.size === 0) {
      services.add("DefaultService");
    }

    // Add Services
    services.forEach((srv) => {
      const srvId = `srv_${toNodeId(srv)}`;
      lines.push(`  ${srvId}["🛠️ ${srv}"]`);
      lines.push(`  class ${srvId} service;`);
    });

    // Add database subgraph
    lines.push(`  subgraph Database ["🗄️ Database: ${dbType}"]`);
    
    // Create corresponding tables/collections
    services.forEach((srv) => {
      const srvId = `srv_${toNodeId(srv)}`;
      let tableName = "records";
      if (srv.toLowerCase().endsWith("service")) {
        const base = srv.slice(0, -7).toLowerCase();
        tableName = base === "auth" ? "users" : `${base}s`;
      } else {
        tableName = `${srv.toLowerCase()}s`;
      }

      const tableId = `tbl_${toNodeId(tableName)}`;
      lines.push(`    ${tableId}[("🔲 ${tableName} table")]`);
      lines.push(`    class ${tableId} table;`);
    });
    lines.push("  end");

    // Connections
    services.forEach((srv) => {
      const srvId = `srv_${toNodeId(srv)}`;
      let tableName = "records";
      if (srv.toLowerCase().endsWith("service")) {
        const base = srv.slice(0, -7).toLowerCase();
        tableName = base === "auth" ? "users" : `${base}s`;
      } else {
        tableName = `${srv.toLowerCase()}s`;
      }
      const tableId = `tbl_${toNodeId(tableName)}`;
      lines.push(`  ${srvId} --> ${tableId}`);
    });

    return lines.join("\n");
  }

  /**
   * 5. Middleware Execution Flow
   */
  static generateMiddlewareFlow(endpoints: any[]): string {
    let lines: string[] = [
      "graph TD",
      "  %% Styling definitions",
      "  classDef entry fill:#eceff1,stroke:#455a64,stroke-width:2px,color:#263238;",
      "  classDef mw fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#f57f17;",
      "  classDef route fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;",
      "  classDef ctrl fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#1b5e20;"
    ];

    lines.push('  req["📥 Incoming Client Request"]');
    lines.push("  class req entry;");

    // Unique middlewares
    const allMiddlewares = new Set<string>();
    endpoints.forEach((ep) => {
      if (ep.middleware && Array.isArray(ep.middleware)) {
        ep.middleware.forEach((m) => {
          if (m) allMiddlewares.add(m);
        });
      }
    });

    // Draw middleware pipelines
    if (allMiddlewares.size === 0) {
      lines.push('  routing["🗺️ Router Dispatcher"]');
      lines.push("  req --> routing");
      
      if (endpoints.length > 0) {
        const ep = endpoints[0];
        lines.push(`  endpoint["🎯 ${ep.method || "GET"} ${ep.route || "/"}"]`);
        lines.push(`  ctrl["⚙️ ${ep.controller || "handler"}"]`);
        lines.push("  routing --> endpoint");
        lines.push("  endpoint --> ctrl");
        lines.push("  class endpoint route;");
        lines.push("  class ctrl ctrl;");
      } else {
        lines.push('  empty["No endpoints or middlewares discovered."]');
        lines.push("  routing --> empty");
      }
    } else {
      // Create global middleware blocks
      let lastNode = "req";
      const mws = Array.from(allMiddlewares);
      
      mws.forEach((mw, index) => {
        const mwId = `mw_${toNodeId(mw)}`;
        lines.push(`  ${mwId}["🛡️ Middleware: ${mw}"]`);
        lines.push(`  class ${mwId} mw;`);
        lines.push(`  ${lastNode} --> ${mwId}`);
        lastNode = mwId;
      });

      lines.push('  routing["🗺️ Router Dispatcher"]');
      lines.push(`  ${lastNode} --> routing`);

      // Fork to a sample of routes
      const sampleEndpoints = endpoints.slice(0, 3);
      sampleEndpoints.forEach((ep, idx) => {
        const epNodeId = `ep_flow_${idx}`;
        const ctrlNodeId = `ctrl_flow_${idx}`;
        lines.push(`  ${epNodeId}["🎯 ${ep.method} ${ep.route}"]`);
        lines.push(`  class ${epNodeId} route;`);
        lines.push(`  routing --> ${epNodeId}`);
        
        if (ep.controller) {
          lines.push(`  ${ctrlNodeId}["⚙️ ${ep.controller}"]`);
          lines.push(`  class ${ctrlNodeId} ctrl;`);
          lines.push(`  ${epNodeId} --> ${ctrlNodeId}`);
        }
      });
    }

    return lines.join("\n");
  }

  /**
   * 6. Request Lifecycle
   */
  static generateRequestLifecycle(project: ProjectEntity): string {
    const dbName = project.database || "Database";
    const authType = project.authentication || "Auth Middleware";
    
    return `sequenceDiagram
  autonumber
  actor Client as 📱 Client App
  participant MW as 🛡️ Express Middlewares
  participant Route as 🗺️ Router
  participant Controller as ⚙️ Controller Layer
  participant Service as 🛠️ Service Layer
  participant DB as 🗄️ DB (${dbName})

  Client->>MW: 1. Send HTTP Request (Headers, Body)
  Note over MW: CORS, Helmet, rateLimit,<br/>express.json() parser

  alt Route requires authentication (${authType})
    MW->>MW: Validate token / Session checks
    Note over MW: If token invalid, return 401 Unauthorized
  end

  MW->>Route: 2. Dispatch clean Request
  Route->>Controller: 3. Route matching handler called

  Note over Controller: Perform DTO / Input Validation

  Controller->>Service: 4. Invoke service business method
  Service->>DB: 5. Query or update database
  DB-->>Service: 6. Return raw results
  
  Note over Service: Apply domain logic & mappings
  
  Service-->>Controller: 7. Deliver business payload
  
  Note over Controller: Format Response body & Status code

  Controller-->>Client: 8. Return HTTP Response (JSON)
`;
  }

  /**
   * 7. High-Level Project Dependency Graph
   */
  static generateDependencyGraph(project: ProjectEntity): string {
    const dbType = project.database || "Database";
    const authType = project.authentication || "JWT";
    const framework = project.framework || "Express";

    return `graph TD
  %% Styling definitions
  classDef layer fill:#f1f2f6,stroke:#70a1ff,stroke-width:3px,color:#2f3542;
  classDef tech fill:#ffeaa7,stroke:#eccc68,stroke-width:2px,color:#2f3542;
  classDef ext fill:#ffcbcb,stroke:#ff6b6b,stroke-width:2px,color:#2f3542;

  subgraph Architecture ["🏗️ Clean Layered Architecture"]
    L1["🌐 Client Layer (React Frontend)"]
    L2["🗺️ Routing & Middleware Layer"]
    L3["⚙️ Controller Layer (Orchestration)"]
    L4["🛠️ Service Layer (Business Logic)"]
    L5["🗄️ Storage Layer (${dbType})"]

    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
  end

  subgraph TechnologyStack ["🛠️ Tech Stack & Integrations"]
    T_Vite["Vite DevServer"]
    T_Express["${framework} Framework"]
    T_Auth["${authType} System"]
    T_Db["${dbType} Driver / SDK"]

    T_Vite -.-> L1
    T_Express -.-> L2
    T_Auth -.-> L3
    T_Db -.-> L5
  end

  class L1,L2,L3,L4,L5 layer;
  class T_Vite,T_Express,T_Auth,T_Db tech;
`;
  }
}
