import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeGeneratorService {
  // Hàm chính để router ngôn ngữ
  public prepareRunnableCode(
    language: string,
    userCode: string,
    input: any,
    functionName: string,
  ): string {
    const inputValues = Object.values(input);

    switch (language) {
      case 'typescript':
      case 'javascript':
        return this.generateJsDriver(userCode, inputValues, functionName);

      case 'python':
        return this.generatePythonDriver(userCode, inputValues, functionName);

      case 'cpp':
      case 'c++':
        return this.generateCppDriver(userCode, inputValues, functionName);

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
    const argString = args.map((val) => this.formatCppInput(val)).join(', ');

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
    // boolalpha để in true/false thay vì 1/0
    cout << boolalpha << sol.${functionName}(${argString}) << endl;
    return 0;
}
`;
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
