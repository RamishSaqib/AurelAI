export const DEFAULT_CODE: Record<string, string> = {
    javascript: '// Type your code here...\n\nfunction example() {\n  console.log("Hello World");\n  return true;\n}',
    typescript: '// Type your code here...\n\nfunction example(): boolean {\n  console.log("Hello World");\n  return true;\n}',
    python: '# Type your code here...\n\ndef example():\n    print("Hello World")\n    return True',
    java: '// Type your code here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
    cpp: '// Type your code here...\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}',
    html: '<!-- Type your code here -->\n\n<!DOCTYPE html>\n<html>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>',
    css: '/* Type your code here */\n\nbody {\n    background-color: #f0f0f0;\n}',
    json: '{\n    "message": "Hello World"\n}',
};
