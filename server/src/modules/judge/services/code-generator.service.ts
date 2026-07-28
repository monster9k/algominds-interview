import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeGeneratorService {
  // Hàm chính để router ngôn ngữ
  public prepareRunnableCode(
    language: string,
    userCode: string,
    input: any,
    functionName: string,
  ): { code: string; stdin?: string } {
    const inputValues = Object.values(input);

    switch (language) {
      case 'typescript':
      case 'javascript':
        return {
          code: this.generateJsDriver(userCode, inputValues, functionName),
        };

      case 'python':
        return {
          code: this.generatePythonDriver(userCode, inputValues, functionName),
        };

      case 'cpp':
      case 'c++':
        return {
          code: this.generateCppDriver(userCode, inputValues, functionName),
        };

      case 'java':
        return this.generateJavaDriver(userCode, inputValues, functionName);

      default:
        throw new Error(`Language ${language} not supported yet`);
    }
  }

  // --- 1. JAVASCRIPT / TYPESCRIPT ---
  private generateJsDriver(
    userCode: string,
    args: any[],
    functionName: string,
  ): string {
    const argString = args.map((val) => JSON.stringify(val)).join(', ');
    return `
      ${userCode}
      try {
        console.log(JSON.stringify(${functionName}(${argString})));
      } catch (e) { console.error(e); }
    `;
  }

  // --- 2. PYTHON ---
  private generatePythonDriver(
    userCode: string,
    args: any[],
    functionName: string,
  ): string {
    const argString = args
      .map((val) =>
        JSON.stringify(val)
          .replace(/true/g, 'True')
          .replace(/false/g, 'False')
          .replace(/null/g, 'None'),
      )
      .join(', ');

    return `
import json
import collections
from typing import *

${userCode}

# Driver Code giả định user viết class Solution
try:
    if 'Solution' in locals():
        sol = Solution()
        result = sol.${functionName}(${argString})
    else:
        # Fallback nếu user viết hàm lẻ
        result = ${functionName}(${argString})
    
    print(json.dumps(result))
except Exception as e:
    print(str(e))
`;
  }

  // --- 3. C++ ---
  private generateCppDriver(
    userCode: string,
    args: any[],
    functionName: string,
  ): string {
    // Generate proper variable declarations instead of inline initialization
    const argDeclarations = args
      .map((val, index) => {
        if (Array.isArray(val)) {
          const content = val.map((v) => this.formatCppInput(v)).join(', ');
          return `    vector<int> arg${index} = {${content}};`;
        } else if (typeof val === 'string') {
          return `    string arg${index} = "${val}";`;
        } else {
          return `    auto arg${index} = ${val};`;
        }
      })
      .join('\n');

    const argNames = args.map((_, index) => `arg${index}`).join(', ');

    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <unordered_map>
#include <set>
#include <stack>
#include <queue>
using namespace std;

// Helper in vector (Debug)
void printVector(const vector<int>& v) {
    cout << "[";
    for(int i=0; i<v.size(); ++i) cout << v[i] << (i<v.size()-1 ? "," : "");
    cout << "]";
}

// USER CODE
${userCode}

int main() {
    Solution sol;

${argDeclarations}
    auto result = sol.${functionName}(${argNames});

    printVector(result);
    cout << endl;

    return 0;
}
`;
  }

  // --- 4. JAVA ---
  private generateJavaDriver(
    userCode: string,
    args: any[],
    functionName: string,
  ): { code: string; stdin: string } {
    const { readerCode, argNames, stdinLines } =
      this.buildJavaInputReader(args);

    // Java only allows one public class per file, and all import statements
    // must appear at the absolute top of the file (before any class).
    // The user's raw code may contain its own `import ...;` lines, which
    // cannot stay inline with `class Solution` once it's concatenated
    // after `public class Main` — so we extract them first.
    const importRegex = /^import\s+[\w.*]+;\s*$/gm;
    const userImports = (userCode.match(importRegex) ?? []).join('\n');
    const codeWithoutImports = userCode.replace(importRegex, '').trim();

    // Java only allows one public class per file.
    // The file is named Main.java, so Solution must NOT be public.
    const sanitizedUserCode = codeWithoutImports.replace(
      /\bpublic\s+(class\s+Solution)/g,
      '$1',
    );

    // IMPORTANT: `public class Main` must be declared BEFORE `class Solution`.
    // Piston's Java runner resolves the entry point as the first class
    // declared in the file, regardless of the `public` modifier — placing
    // Solution first causes it to try `java Solution` and fail with
    // "can't find main(String[]) method in class: Solution".
    const code = `
${userImports}
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        ${readerCode}
        Solution sol = new Solution();
        var result = sol.${functionName}(${argNames.join(', ')});
        System.out.println(toJson(result));
    }

    private static String toJson(Object obj) {
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (obj instanceof Integer[]) {
            Integer[] arr = (Integer[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) { if (i > 0) sb.append(","); sb.append(arr[i]); }
            return sb.append("]").toString();
        }
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) { if (i > 0) sb.append(","); sb.append(toJson(list.get(i))); }
            return sb.append("]").toString();
        }
        if (obj instanceof String) return "\\"" + obj + "\\"";
        if (obj instanceof Boolean) return obj.toString();
        return String.valueOf(obj);
    }
}

${sanitizedUserCode}
`;

    return { code, stdin: stdinLines.join('\n') };
  }

  private buildJavaInputReader(args: any[]): {
    readerCode: string;
    argNames: string[];
    stdinLines: string[];
  } {
    const readerLines: string[] = [];
    const argNames: string[] = [];
    const stdinLines: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const val = args[i];
      const name = `arg${i}`;
      argNames.push(name);

      if (Array.isArray(val) && val.every((v) => Number.isInteger(v))) {
        stdinLines.push(String(val.length));
        stdinLines.push(val.join(' '));
        readerLines.push(
          `int ${name}Len = Integer.parseInt(br.readLine().trim());`,
        );
        readerLines.push(`int[] ${name} = new int[${name}Len];`);
        readerLines.push(
          `{ StringTokenizer st${i} = new StringTokenizer(br.readLine()); for (int j = 0; j < ${name}Len; j++) ${name}[j] = Integer.parseInt(st${i}.nextToken()); }`,
        );
      } else if (Number.isInteger(val)) {
        stdinLines.push(String(val));
        readerLines.push(
          `int ${name} = Integer.parseInt(br.readLine().trim());`,
        );
      } else if (typeof val === 'string') {
        stdinLines.push(val);
        readerLines.push(`String ${name} = br.readLine().trim();`);
      } else if (typeof val === 'boolean') {
        stdinLines.push(val ? 'true' : 'false');
        readerLines.push(
          `boolean ${name} = Boolean.parseBoolean(br.readLine().trim());`,
        );
      }
    }

    return {
      readerCode: readerLines.join('\n        '),
      argNames,
      stdinLines,
    };
  }

  // Helper C++ Formatting
  private formatCppInput(val: any): string {
    if (Array.isArray(val)) {
      const content = val.map((v) => this.formatCppInput(v)).join(', ');
      return `{${content}}`;
    }
    if (typeof val === 'string') {
      return `"${val}"`;
    }
    return String(val);
  }
}
