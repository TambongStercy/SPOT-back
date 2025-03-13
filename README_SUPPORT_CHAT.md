# SPOTT Support Chat - Flutter Implementation Guide

## Overview

This document provides comprehensive guidelines for implementing the support chat feature in the SPOTT Flutter application. The support chat system allows users to communicate with admin staff for assistance, with real-time notifications powered by Firebase Cloud Messaging (FCM).

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [FCM Integration](#fcm-integration)
6. [UI Implementation](#ui-implementation)
7. [State Management](#state-management)
8. [Handling Notifications](#handling-notifications)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Architecture

The support chat feature follows a client-server architecture:

- **Backend**: Node.js REST API with MongoDB (already implemented)
- **Frontend**: Flutter application with FCM integration
- **Real-time Communication**: Firebase Cloud Messaging for push notifications

## Prerequisites

Before implementing the support chat feature, ensure you have:

1. Flutter SDK (latest stable version)
2. Firebase project set up with FCM enabled
3. `firebase_core` and `firebase_messaging` packages installed
4. SPOTT API access credentials
5. Proper user authentication implemented

Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^latest_version
  firebase_messaging: ^latest_version
  flutter_local_notifications: ^latest_version
  http: ^latest_version
  provider: ^latest_version # or your preferred state management solution
```

## API Endpoints

The support chat system exposes the following REST endpoints:

### User Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/support/create` | POST | Create a new support chat | Required |
| `/api/v1/support/message` | POST | Add a message to a chat | Required |
| `/api/v1/support/user` | GET | Get user's chat history | Required |
| `/api/v1/support/:chatId` | GET | Get chat details with messages | Required |

### Admin Endpoints (for admin app only)

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/v1/support/admin` | GET | Get chats for admin view | Admin Required |
| `/api/v1/support/:chatId/assign` | POST | Assign an admin to a chat | Admin Required |
| `/api/v1/support/:chatId/status` | PUT | Update a chat's status | Admin Required |

## Data Models

### Chat Model

```dart
class Chat {
  final String id;
  final String userId;
  final String? adminId;
  final String subject;
  final String status; // "open", "closed", "pending"
  final DateTime createdAt;
  final DateTime lastMessageAt;
  final int userUnreadCount;
  final int adminUnreadCount;
  final List<Message> messages;
  
  // Constructor, fromJson, toJson methods
}
```

### Message Model

```dart
class Message {
  final String id;
  final String senderId;
  final String content;
  final bool isRead;
  final List<String> attachments;
  final DateTime createdAt;
  
  // Constructor, fromJson, toJson methods
}
```

## FCM Integration

### Setup FCM in Flutter

1. **Initialize Firebase**:

```dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Set up FCM
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  // Send token to backend
  if (fcmToken != null) {
    await updateFcmToken(fcmToken);
  }
  
  // Listen for token refresh
  FirebaseMessaging.instance.onTokenRefresh.listen(updateFcmToken);
  
  runApp(MyApp());
}

Future<void> updateFcmToken(String token) async {
  // Call your API to update the token
  // Example: UserService.updateFcmToken(token);
}
```

2. **Configure FCM Permissions**:

```dart
Future<void> requestNotificationPermissions() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  
  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    print('User granted permission');
  } else {
    print('User declined permission');
  }
}
```

3. **Set up Notification Handlers**:

```dart
void setupFcmHandlers() {
  // Handle messages when app is in foreground
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    
    // Check if message is a chat notification
    if (message.data['type'] == 'chat') {
      handleChatNotification(message);
    }
    
    // Show local notification
    if (message.notification != null) {
      showLocalNotification(message);
    }
  });

  // Handle when user taps on notification (app was in background)
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    if (message.data['type'] == 'chat') {
      // Navigate to chat screen
      navigateToChatScreen(message.data['chatId']);
    }
  });
}
```

## UI Implementation

### Chat List Screen

Create a screen to display all user chats:

```dart
class ChatListScreen extends StatefulWidget {
  @override
  _ChatListScreenState createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  List<Chat> chats = [];
  bool isLoading = true;
  
  @override
  void initState() {
    super.initState();
    fetchChats();
  }
  
  Future<void> fetchChats() async {
    setState(() => isLoading = true);
    try {
      // Call your API service
      final response = await ChatService.getUserChats();
      setState(() {
        chats = response.chats;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      // Show error
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Support Chats')),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : chats.isEmpty
              ? Center(child: Text('No support chats yet'))
              : ListView.builder(
                  itemCount: chats.length,
                  itemBuilder: (context, index) {
                    final chat = chats[index];
                    return ChatListItem(
                      chat: chat,
                      onTap: () => navigateToChatDetail(chat.id),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.add),
        onPressed: () => navigateToNewChat(),
      ),
    );
  }
}
```

### Chat Detail Screen

Create a screen to display chat messages and allow sending new messages:

```dart
class ChatDetailScreen extends StatefulWidget {
  final String chatId;
  
  ChatDetailScreen({required this.chatId});
  
  @override
  _ChatDetailScreenState createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  Chat? chat;
  bool isLoading = true;
  final TextEditingController messageController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    fetchChatDetails();
  }
  
  Future<void> fetchChatDetails() async {
    setState(() => isLoading = true);
    try {
      // Call your API service
      final response = await ChatService.getChatDetails(widget.chatId);
      setState(() {
        chat = response.chat;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      // Show error
    }
  }
  
  Future<void> sendMessage() async {
    if (messageController.text.trim().isEmpty) return;
    
    try {
      await ChatService.addMessage(
        chatId: widget.chatId,
        content: messageController.text.trim(),
      );
      
      messageController.clear();
      // Refresh chat to show new message
      fetchChatDetails();
    } catch (e) {
      // Show error
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(chat?.subject ?? 'Chat'),
        actions: [
          if (chat?.status == 'open')
            IconButton(
              icon: Icon(Icons.info_outline),
              onPressed: () => showChatInfo(),
            ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Status banner
                if (chat?.status == 'closed')
                  Container(
                    color: Colors.red.shade100,
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Center(
                      child: Text(
                        'This chat has been closed',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
                
                // Messages list
                Expanded(
                  child: ListView.builder(
                    reverse: true,
                    itemCount: chat?.messages.length ?? 0,
                    itemBuilder: (context, index) {
                      final message = chat!.messages[chat!.messages.length - 1 - index];
                      return MessageBubble(
                        message: message,
                        isUser: message.senderId == currentUserId,
                      );
                    },
                  ),
                ),
                
                // Message input
                if (chat?.status != 'closed')
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: messageController,
                            decoration: InputDecoration(
                              hintText: 'Type a message...',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.send),
                          onPressed: sendMessage,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
    );
  }
}
```

### Create New Chat Screen

```dart
class NewChatScreen extends StatefulWidget {
  @override
  _NewChatScreenState createState() => _NewChatScreenState();
}

class _NewChatScreenState extends State<NewChatScreen> {
  final TextEditingController subjectController = TextEditingController();
  final TextEditingController messageController = TextEditingController();
  bool isSubmitting = false;
  
  Future<void> createChat() async {
    if (subjectController.text.trim().isEmpty ||
        messageController.text.trim().isEmpty) {
      // Show validation error
      return;
    }
    
    setState(() => isSubmitting = true);
    try {
      final response = await ChatService.createChat(
        subject: subjectController.text.trim(),
        message: messageController.text.trim(),
      );
      
      setState(() => isSubmitting = false);
      
      // Navigate to chat detail
      Navigator.pop(context); // Close current screen
      navigateToChatDetail(response.chat.id);
    } catch (e) {
      setState(() => isSubmitting = false);
      // Show error
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('New Support Request')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: subjectController,
              decoration: InputDecoration(
                labelText: 'Subject',
                hintText: 'What do you need help with?',
              ),
            ),
            SizedBox(height: 16),
            Expanded(
              child: TextField(
                controller: messageController,
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
                decoration: InputDecoration(
                  labelText: 'Message',
                  hintText: 'Describe your issue in detail',
                  alignLabelWithHint: true,
                ),
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: isSubmitting ? null : createChat,
              child: isSubmitting
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## State Management

Implement a chat service and provider for state management:

```dart
class ChatProvider extends ChangeNotifier {
  List<Chat> _chats = [];
  Chat? _currentChat;
  bool _isLoading = false;
  
  List<Chat> get chats => _chats;
  Chat? get currentChat => _currentChat;
  bool get isLoading => _isLoading;
  
  Future<void> fetchUserChats() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await ChatService.getUserChats();
      _chats = response.chats;
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> fetchChatDetails(String chatId) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await ChatService.getChatDetails(chatId);
      _currentChat = response.chat;
    } catch (e) {
      // Handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> sendMessage(String chatId, String content) async {
    try {
      await ChatService.addMessage(
        chatId: chatId,
        content: content,
      );
      
      // Refresh chat details
      await fetchChatDetails(chatId);
    } catch (e) {
      // Handle error
    }
  }
  
  Future<Chat> createNewChat(String subject, String message) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final response = await ChatService.createChat(
        subject: subject,
        message: message,
      );
      
      // Add to chats list
      _chats.add(response.chat);
      _currentChat = response.chat;
      
      return response.chat;
    } catch (e) {
      // Handle error
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

## Handling Notifications

### Local Notification Setup

```dart
class NotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();
      
  static Future<void> initialize() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
        
    final DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestSoundPermission: false,
      requestBadgePermission: false,
      requestAlertPermission: false,
    );
    
    final InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    
    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap
        final payload = response.payload;
        if (payload != null) {
          final data = json.decode(payload);
          if (data['type'] == 'chat') {
            navigateToChatDetail(data['chatId']);
          }
        }
      },
    );
  }
  
  static Future<void> showNotification({
    required String title,
    required String body,
    required Map<String, dynamic> payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'support_chat_channel',
      'Support Chat Notifications',
      channelDescription: 'Notifications for support chat messages',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );
    
    const DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );
    
    await _notificationsPlugin.show(
      DateTime.now().millisecond,
      title,
      body,
      platformChannelSpecifics,
      payload: json.encode(payload),
    );
  }
}
```

### Handle FCM Chat Notifications

```dart
void handleChatNotification(RemoteMessage message) {
  // Extract data from FCM message
  final data = message.data;
  final chatId = data['chatId'];
  final messageContent = data['message'];
  final senderName = data['senderName'];
  
  // Show local notification
  NotificationService.showNotification(
    title: 'New message from $senderName',
    body: messageContent,
    payload: {
      'type': 'chat',
      'chatId': chatId,
    },
  );
  
  // If in chat list or detail screen, refresh data
  if (currentScreen == 'chat_list') {
    // Refresh chat list
    chatProvider.fetchUserChats();
  } else if (currentScreen == 'chat_detail' && currentChatId == chatId) {
    // Refresh current chat
    chatProvider.fetchChatDetails(chatId);
  }
}
```

### Chat Notification Categories

The SPOTT app uses the following notification categories for support chat:

| Category | Type | Description | Sender | Recipient |
|----------|------|-------------|--------|-----------|
| `chat` | `new_chat` | New support chat created | User | Admins |
| `chat` | `new_message` | New message in existing chat | User/Admin | Admin/User |
| `chat` | `status_update` | Chat status changed | Admin | User |

These categories align with the notification system described in the Firebase Notifications README, ensuring consistent handling across the application.

### Notification Payload Structure

Chat notifications follow this structure:

```dart
{
  notification: {
    title: "New message from John Doe",
    body: "Hello, I need help with my account"
  },
  data: {
    category: "chat",
    type: "new_message",
    chatId: "chat123",
    messageId: "msg456",
    senderId: "user789",
    senderName: "John Doe",
    timestamp: "2023-06-15T10:30:00Z",
    deepLink: "true",
    notificationId: "unique-id-for-analytics"
  }
}
```

### Deep Linking from Notifications

When a user taps on a chat notification, the app should navigate to the appropriate screen:

```dart
void handleNotificationTap(Map<String, dynamic> data) {
  if (data['category'] == 'chat') {
    final chatId = data['chatId'];
    
    // Navigate based on notification type
    switch (data['type']) {
      case 'new_chat':
      case 'new_message':
      case 'status_update':
        // Navigate to chat detail screen
        navigateToChatDetail(chatId);
        break;
      default:
        // Default to chat list
        navigateToChatList();
        break;
    }
  }
}
```

### Background Message Handling

To handle messages when the app is in the background:

```dart
// Register background handler in main.dart
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Set background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Rest of your initialization code
  runApp(MyApp());
}

// Background message handler
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Initialize Firebase if needed
  await Firebase.initializeApp();
  
  print("Handling a background message: ${message.messageId}");
  
  // For chat notifications, we'll let the system show the notification
  // When user taps, we'll handle navigation in onMessageOpenedApp
}
```

### User Notification Preferences

Respect user preferences for chat notifications:

```dart
class UserPreferences {
  // Get user notification preferences
  static Future<Map<String, bool>> getNotificationPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'general': prefs.getBool('notifications_general') ?? true,
      'chat': prefs.getBool('notifications_chat') ?? true,
      // Other notification categories
    };
  }
  
  // Check if a specific notification type is enabled
  static Future<bool> isNotificationEnabled(String category) async {
    final prefs = await getNotificationPreferences();
    return prefs['general'] == true && prefs[category] == true;
  }
  
  // Update notification preferences
  static Future<void> updateNotificationPreference(String category, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_$category', value);
  }
}
```

In your notification handling code:

```dart
Future<void> processNotification(RemoteMessage message) async {
  final data = message.data;
  final category = data['category'];
  
  // Check if this notification type is enabled
  final isEnabled = await UserPreferences.isNotificationEnabled(category);
  if (!isEnabled) {
    print('Notification type $category is disabled by user');
    return;
  }
  
  // Process notification
  if (category == 'chat') {
    handleChatNotification(message);
  }
}
```

## Best Practices

1. **Offline Support**:
   - Implement local caching of chat messages
   - Queue outgoing messages when offline
   - Sync when connection is restored

2. **Performance**:
   - Implement pagination for chat history
   - Lazy load images and attachments
   - Use efficient list rendering with `ListView.builder`

3. **User Experience**:
   - Show typing indicators
   - Display message delivery status
   - Provide pull-to-refresh for chat updates
   - Implement proper error handling with retry options

4. **Security**:
   - Secure storage of chat history
   - Proper token management
   - Input validation before sending

5. **Accessibility**:
   - Support screen readers
   - Implement proper contrast ratios
   - Provide alternative text for images

## Troubleshooting

### Common Issues and Solutions

1. **FCM Notifications Not Received**:
   - Verify FCM token is correctly sent to backend
   - Check Firebase project configuration
   - Ensure proper permissions are granted
   - Verify notification channel is created on Android

2. **Messages Not Sending**:
   - Check network connectivity
   - Verify authentication token is valid
   - Implement proper error handling and retry logic

3. **Chat List Not Updating**:
   - Implement proper state management
   - Set up listeners for real-time updates
   - Add pull-to-refresh functionality

4. **High Battery Consumption**:
   - Optimize background services
   - Use efficient polling strategies
   - Implement proper FCM handling

### Debugging Tips

1. Enable verbose logging for FCM:
```dart
FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
  alert: true,
  badge: true,
  sound: true,
);
```

2. Test FCM integration using Firebase Console

3. Monitor network requests using a proxy tool like Charles or Fiddler

4. Implement proper error logging and crash reporting

---

## API Service Implementation

Below is a sample implementation of the ChatService class that interacts with the backend API:

```dart
class ChatService {
  static final String baseUrl = 'https://api.spott.com/api/v1';
  static final String supportEndpoint = '$baseUrl/support';
  
  static Future<Map<String, String>> _getHeaders() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }
  
  static Future<ChatListResponse> getUserChats({
    int page = 1,
    int limit = 20,
  }) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$supportEndpoint/user?page=$page&limit=$limit'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return ChatListResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load chats: ${response.body}');
    }
  }
  
  static Future<ChatDetailResponse> getChatDetails(String chatId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$supportEndpoint/$chatId'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return ChatDetailResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load chat details: ${response.body}');
    }
  }
  
  static Future<MessageResponse> addMessage({
    required String chatId,
    required String content,
    List<String> attachments = const [],
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$supportEndpoint/message'),
      headers: headers,
      body: json.encode({
        'chatId': chatId,
        'content': content,
        'attachments': attachments,
      }),
    );
    
    if (response.statusCode == 200) {
      return MessageResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to send message: ${response.body}');
    }
  }
  
  static Future<ChatResponse> createChat({
    required String subject,
    required String message,
  }) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$supportEndpoint/create'),
      headers: headers,
      body: json.encode({
        'subject': subject,
        'message': message,
      }),
    );
    
    if (response.statusCode == 201) {
      return ChatResponse.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to create chat: ${response.body}');
    }
  }
}
```

This documentation provides a comprehensive guide for implementing the support chat feature in your Flutter application, including FCM integration for real-time notifications. 