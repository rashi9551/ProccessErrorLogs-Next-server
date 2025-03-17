// Helper function to calculate priority (lower number = higher priority)
export default function calculatePriority(fileSize:number) {
    // Example: files < 1MB get priority 1, < 10MB get priority 2, otherwise 3
    if (fileSize < 1024 * 1024) return 1;
    if (fileSize < 10 * 1024 * 1024) return 2;
    return 3;
  }