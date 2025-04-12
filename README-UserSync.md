# User Synchronization Guide

This document explains how to implement and use the user synchronization feature in the SPOTT application.

## Overview

User synchronization ensures that the client application (mobile app) has the most up-to-date basic user information from the server. This is important for:

1. Keeping profile information current
2. Updating points and rewards
3. Syncing verification status
4. Ensuring referral codes are valid
5. Maintaining consistent user experience across devices

## Server-Side Implementation

### Endpoint

The server provides a dedicated endpoint for user synchronization:

```
GET /api/v1/user/sync
```

This endpoint requires authentication and accepts an optional `lastSyncTimestamp` query parameter.

### Request

```
GET /api/v1/user/sync?lastSyncTimestamp=2023-03-15T10:30:00.000Z
```

Headers:
```
Authorization: Bearer <jwt_token>
```

### Response

```json
{
  "success": true,
  "hasUpdates": true,
  "syncTimestamp": "2023-03-15T12:45:30.123Z",
  "user": {
    "_id": "60f8a5b3e6b3f32d8c9e4b7a",
    "name": "John Doe",
    "username": "@johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "phoneVerified": true,
    "verifiedEmail": true,
    "points": 250,
    "refferalCode": "JOHND1234",
    "avatar": "https://example.com/avatars/johndoe.jpg",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "sex": "Male",
    "role": "user"
  }
}
```

## Client-Side Implementation

### Flutter Implementation

#### 1. Create a User Sync Service

```dart
class UserSyncService {
  final String baseUrl;
  final String authToken;
  
  UserSyncService({required this.baseUrl, required this.authToken});
  
  Future<Map<String, dynamic>> syncUserInfo() async {
    try {
      // Get the last sync timestamp from local storage
      final prefs = await SharedPreferences.getInstance();
      final lastSyncTimestamp = prefs.getString('last_user_sync_timestamp');
      
      // Prepare the URL with query parameters
      final uri = Uri.parse('$baseUrl/api/v1/user/sync').replace(
        queryParameters: lastSyncTimestamp != null 
            ? {'lastSyncTimestamp': lastSyncTimestamp}
            : {}
      );
      
      // Make the API request
      final response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Save the new sync timestamp
        if (data['success'] == true) {
          await prefs.setString('last_user_sync_timestamp', data['syncTimestamp']);
          
          // If there are updates, update the local user data
          if (data['hasUpdates'] == true) {
            await _updateLocalUserData(data['user']);
          }
        }
        
        return data;
      } else {
        throw Exception('Failed to sync user data: ${response.statusCode}');
      }
    } catch (e) {
      print('Error syncing user data: $e');
      rethrow;
    }
  }
  
  // Update local user data in storage
  Future<void> _updateLocalUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', json.encode(userData));
  }
}
```

#### 2. When to Sync

Sync user data in the following scenarios:

1. **On App Launch**: Sync when the app starts to ensure the latest data
2. **After Login**: Sync immediately after successful login
3. **On Profile Screen**: Sync when the user views their profile
4. **After Specific Actions**: Sync after actions that might change user data:
   - Earning points
   - Updating profile information
5. **Periodic Background Sync**: Optionally sync periodically if the app is open for a long time

#### 3. Implementation in State Management

If you're using a state management solution like Provider, you can implement it like this:

```dart
class UserProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Load user from local storage
  Future<void> loadUser() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('user_data');
      
      if (userData != null) {
        _user = User.fromJson(json.decode(userData));
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to load user data';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Sync user with server
  Future<void> syncUser() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final authService = locator<AuthService>();
      final syncService = UserSyncService(
        baseUrl: Config.apiBaseUrl,
        authToken: authService.token,
      );
      
      final result = await syncService.syncUserInfo();
      
      if (result['success'] == true && result['hasUpdates'] == true) {
        _user = User.fromJson(result['user']);
      }
      _error = null;
    } catch (e) {
      _error = 'Failed to sync with server';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

## Best Practices

### 1. Efficient Syncing

- Use the `lastSyncTimestamp` to only fetch updates when necessary
- The server should check if user data has changed since the last sync
- Only update local storage if there are actual changes

### 2. Handling Offline Mode

- Always load from local storage first, then sync with server
- If sync fails due to network issues, continue using cached data
- Provide visual indication if data might be outdated

### 3. Security Considerations

- Always use authenticated requests for syncing user data
- Don't store sensitive information in local storage
- Consider encrypting locally stored user data

### 4. Performance Optimization

- Only include necessary fields in the sync response
- Consider compressing response data for slower networks

## Troubleshooting

### Common Issues

1. **Sync Fails After Token Expiry**
   - Implement token refresh before syncing
   - Handle 401 errors by redirecting to login

2. **Data Inconsistency**
   - Implement a "force sync" option that ignores the timestamp
   - Add version tracking to detect schema changes

3. **Excessive API Calls**
   - Implement debouncing for rapid UI actions
   - Set a minimum time between sync operations (e.g., 30 seconds)

### Debugging

- Log sync operations with timestamps
- Include sync status in app diagnostics
- Implement a debug mode that shows detailed sync information 

// Example User model
class User {
  final String id;
  final String name;
  final String username;
  final String email;
  final String phone;
  final bool phoneVerified;
  final bool emailVerified;
  final int points;
  final String referralCode;
  final String? avatar;
  final DateTime dateOfBirth;
  final String sex;
  final String role;
  
  User({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.phone,
    required this.phoneVerified,
    required this.emailVerified,
    required this.points,
    required this.referralCode,
    this.avatar,
    required this.dateOfBirth,
    required this.sex,
    required this.role,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      name: json['name'],
      username: json['username'],
      email: json['email'] ?? '',
      phone: json['phone'],
      phoneVerified: json['phoneVerified'] ?? false,
      emailVerified: json['verifiedEmail'] ?? false,
      points: json['points'] ?? 0,
      referralCode: json['refferalCode'],
      avatar: json['avatar'],
      dateOfBirth: DateTime.parse(json['dateOfBirth']),
      sex: json['sex'],
      role: json['role'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'username': username,
      'email': email,
      'phone': phone,
      'phoneVerified': phoneVerified,
      'verifiedEmail': emailVerified,
      'points': points,
      'refferalCode': referralCode,
      'avatar': avatar,
      'dateOfBirth': dateOfBirth.toIso8601String(),
      'sex': sex,
      'role': role,
    };
  }
} 