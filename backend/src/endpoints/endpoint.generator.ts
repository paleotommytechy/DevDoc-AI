export class EndpointGenerator {
  /**
   * Generates sample request JSON based on fields and HTTP method.
   */
  static generateSampleRequest(fields: Record<string, string>, route: string, method: string): any {
    const isBodyless = ["GET", "DELETE"].includes(method.toUpperCase());
    if (isBodyless) {
      return {};
    }

    const sample: Record<string, any> = {};

    for (const [key, type] of Object.entries(fields)) {
      const typeLower = type.toLowerCase();
      if (typeLower === "string") {
        if (key.includes("email")) {
          sample[key] = "john@example.com";
        } else if (key.includes("password")) {
          sample[key] = "Password123!";
        } else if (key.includes("name")) {
          sample[key] = "John Doe";
        } else if (key.includes("title")) {
          sample[key] = "Sample Title";
        } else if (key.includes("description") || key.includes("desc")) {
          sample[key] = "This is a detailed sample description of the resource.";
        } else if (key.includes("status")) {
          sample[key] = "active";
        } else if (key.includes("token")) {
          sample[key] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ...";
        } else {
          sample[key] = `sample_${key}`;
        }
      } else if (typeLower === "number" || typeLower === "integer" || typeLower === "float") {
        if (key.includes("age")) {
          sample[key] = 25;
        } else if (key.includes("limit")) {
          sample[key] = 10;
        } else if (key.includes("page")) {
          sample[key] = 1;
        } else if (key.includes("price")) {
          sample[key] = 29.99;
        } else {
          sample[key] = 100;
        }
      } else if (typeLower === "boolean") {
        if (key.includes("admin") || key.includes("is_admin")) {
          sample[key] = false;
        } else if (key.includes("active") || key.includes("is_active") || key.includes("enabled")) {
          sample[key] = true;
        } else {
          sample[key] = false;
        }
      } else if (typeLower === "array") {
        sample[key] = [];
      } else if (typeLower === "object") {
        sample[key] = {};
      } else {
        sample[key] = "";
      }
    }

    return sample;
  }

  /**
   * Generates a sample response based on route, method, and status code.
   */
  static generateSampleResponse(route: string, method: string, statusCode: number): any {
    const success = statusCode >= 200 && statusCode < 300;

    if (!success) {
      return {
        success: false,
        message: "An error occurred while processing the request.",
        error: `HTTP Error ${statusCode}`
      };
    }

    const routeLower = route.toLowerCase();

    // Specific templates
    if (routeLower.includes("auth") || routeLower.includes("login") || routeLower.includes("register")) {
      return {
        success: true,
        message: "Authentication successful.",
        data: {
          user: {
            id: "u_12345678",
            email: "john@example.com",
            name: "John Doe",
            createdAt: new Date().toISOString()
          },
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
      };
    }

    if (routeLower.includes("project")) {
      const isList = !route.includes(":id") && method.toUpperCase() === "GET";
      const projectObj = {
        id: "p_87654321",
        name: "My Web Application",
        description: "A secure Express Node.js backend system",
        status: "Analyzed",
        framework: "Express",
        language: "TypeScript",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isList) {
        return {
          success: true,
          message: "Projects retrieved successfully.",
          data: {
            projects: [projectObj]
          }
        };
      }

      return {
        success: true,
        message: "Project details retrieved.",
        data: {
          project: projectObj
        }
      };
    }

    if (routeLower.includes("endpoint")) {
      return {
        success: true,
        message: "Endpoint details.",
        data: {
          id: "ep_999999",
          method: method.toUpperCase(),
          route,
          controller: "MyController.handler"
        }
      };
    }

    // Default template
    return {
      success: true,
      message: "Operation completed successfully.",
      data: {
        id: "id_placeholder",
        createdAt: new Date().toISOString()
      }
    };
  }
}
