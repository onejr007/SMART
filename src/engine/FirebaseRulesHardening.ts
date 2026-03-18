// 34. Hardening Firebase Rules
export class FirebaseRulesHardening {
  generateRules(): string {
    return `{
  "rules": {
    ".read": false,
    ".write": false,
    
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        ".validate": "newData.hasChildren(['name', 'email'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length <= 100"
        },
        "email": {
          ".validate": "newData.isString() && newData.val().matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i)"
        }
      }
    },
    
    "games": {
      ".indexOn": ["ownerId", "createdAt"],
      "$gameId": {
        ".read": true,
        ".write": "auth != null && (!data.exists() || data.child('ownerId').val() == auth.uid)",
        ".validate": "newData.hasChildren(['title', 'ownerId', 'createdAt'])",
        "title": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 100"
        },
        "ownerId": {
          ".validate": "newData.val() == auth.uid"
        },
        "sceneData": {
          ".validate": "newData.val().length <= 1000000"
        }
      }
    },
    
    "leaderboards": {
      "$gameId": {
        ".read": true,
        ".indexOn": ["score"],
        "$userId": {
          ".write": "auth != null && auth.uid == $userId",
          ".validate": "newData.hasChildren(['score', 'timestamp'])",
          "score": {
            ".validate": "newData.isNumber() && newData.val() >= 0"
          }
        }
      }
    },
    
    "audit_logs": {
      ".read": false,
      "$logId": {
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['userId', 'action', 'timestamp'])"
      }
    }
  }
}`;
  }

  validateSchema(data: any, schema: any): boolean {
    // Implement client-side validation
    for (const key in schema) {
      if (schema[key].required && !(key in data)) {
        return false;
      }
      
      if (key in data) {
        const value = data[key];
        const rules = schema[key];
        
        if (rules.type === 'string' && typeof value !== 'string') {
          return false;
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          return false;
        }
      }
    }
    
    return true;
  }
}
