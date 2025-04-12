# Session Location History API Documentation

This document provides information on how to use the Session Location History API endpoints in the SPOTT backend.

## Overview

The Session Location History API allows you to retrieve a user's session history (login, logout, signup, etc.) with pagination support. You can filter results by date range and event type, and navigate through pages of results.

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get User Session History

Retrieves the authenticated user's session history with pagination.

**Endpoint:** `GET /api/users/session-history`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `startDate` (optional): Filter sessions after this date (ISO format)
- `endDate` (optional): Filter sessions before this date (ISO format)
- `eventType` (optional): Filter by event type (login, logout, signup, etc.)

**Example Request:**
```
GET /api/users/session-history?page=2&limit=10&eventType=login&startDate=2023-01-01T00:00:00Z
```

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "60f8a5b3e6b3f32d8c9e4b7a",
      "user": "60f8a5b3e6b3f32d8c9e4b7a",
      "userDevice": {
        "_id": "60f8a5b3e6b3f32d8c9e4b7a",
        "deviceInfo": "iPhone 12, iOS 15.0",
        "fcmToken": "fcm-token-example"
      },
      "eventType": "login",
      "location": {
        "type": "Point",
        "coordinates": [13.4050, 52.5200]
      },
      "deviceInfo": {
        "model": "iPhone 12",
        "os": "iOS 15.0"
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2023-07-20T14:30:00Z"
    },
    // More session records...
  ],
  "pagination": {
    "total": 45,
    "totalPages": 5,
    "currentPage": 2,
    "limit": 10,
    "hasMore": true
  }
}
```

### 2. Get Device Session History

Retrieves session history for a specific device with pagination.

**Endpoint:** `GET /api/users/devices/:deviceId/session-history`

**URL Parameters:**
- `deviceId`: ID of the user device

**Query Parameters:**
- Same as User Session History endpoint

**Example Request:**
```
GET /api/users/devices/60f8a5b3e6b3f32d8c9e4b7a/session-history?page=1&limit=20
```

**Response:**
Same structure as User Session History endpoint

## Implementing Pagination in Frontend

### React/Next.js Example

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const SessionHistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    startDate: '',
    endDate: ''
  });

  const fetchSessions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/session-history', {
        params: {
          page,
          limit: 10,
          eventType: filters.eventType || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSessions(response.data.sessions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const handlePageChange = (newPage) => {
    fetchSessions(newPage);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <h1>Session History</h1>
      
      {/* Filters */}
      <div className="filters">
        <select 
          name="eventType" 
          value={filters.eventType} 
          onChange={handleFilterChange}
        >
          <option value="">All Events</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="signup">Signup</option>
        </select>
        
        <input 
          type="date" 
          name="startDate" 
          value={filters.startDate} 
          onChange={handleFilterChange} 
          placeholder="Start Date"
        />
        
        <input 
          type="date" 
          name="endDate" 
          value={filters.endDate} 
          onChange={handleFilterChange} 
          placeholder="End Date"
        />
      </div>
      
      {/* Sessions List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <p>No sessions found</p>
          ) : (
            sessions.map(session => (
              <div key={session._id} className="session-item">
                <p>Event: {session.eventType}</p>
                <p>Device: {session.userDevice?.deviceInfo}</p>
                <p>Date: {new Date(session.createdAt).toLocaleString()}</p>
                {session.location?.coordinates.length > 0 && (
                  <p>Location: {session.location.coordinates.join(', ')}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1 || loading}
        >
          Previous
        </button>
        
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasMore || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SessionHistoryPage;
```

### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class SessionHistoryPage extends StatefulWidget {
  @override
  _SessionHistoryPageState createState() => _SessionHistoryPageState();
}

class _SessionHistoryPageState extends State<SessionHistoryPage> {
  List<dynamic> sessions = [];
  Map<String, dynamic> pagination = {
    'currentPage': 1,
    'totalPages': 1,
    'hasMore': false
  };
  bool isLoading = false;
  String? eventTypeFilter;
  DateTime? startDateFilter;
  DateTime? endDateFilter;

  @override
  void initState() {
    super.initState();
    fetchSessions();
  }

  Future<void> fetchSessions({int page = 1}) async {
    setState(() {
      isLoading = true;
    });

    try {
      // Build query parameters
      Map<String, String> queryParams = {
        'page': page.toString(),
        'limit': '10',
      };
      
      if (eventTypeFilter != null) {
        queryParams['eventType'] = eventTypeFilter!;
      }
      
      if (startDateFilter != null) {
        queryParams['startDate'] = startDateFilter!.toIso8601String();
      }
      
      if (endDateFilter != null) {
        queryParams['endDate'] = endDateFilter!.toIso8601String();
      }

      // Get token from secure storage
      final token = await getToken(); // Implement this method based on your auth system
      
      // Make API request
      final response = await http.get(
        Uri.parse('https://your-api-url.com/api/users/session-history')
            .replace(queryParameters: queryParams),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          sessions = data['sessions'];
          pagination = data['pagination'];
          isLoading = false;
        });
      } else {
        throw Exception('Failed to load sessions');
      }
    } catch (e) {
      print('Error fetching sessions: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Session History'),
      ),
      body: Column(
        children: [
          // Filters
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                DropdownButton<String>(
                  hint: Text('Select Event Type'),
                  value: eventTypeFilter,
                  onChanged: (value) {
                    setState(() {
                      eventTypeFilter = value;
                    });
                    fetchSessions(page: 1);
                  },
                  items: [
                    DropdownMenuItem(value: null, child: Text('All Events')),
                    DropdownMenuItem(value: 'login', child: Text('Login')),
                    DropdownMenuItem(value: 'logout', child: Text('Logout')),
                    DropdownMenuItem(value: 'signup', child: Text('Signup')),
                  ],
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setState(() {
                            startDateFilter = date;
                          });
                          fetchSessions(page: 1);
                        }
                      },
                      child: Text(startDateFilter != null 
                        ? 'Start: ${startDateFilter!.toLocal().toString().split(' ')[0]}'
                        : 'Select Start Date'),
                    ),
                    TextButton(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime.now(),
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setState(() {
                            endDateFilter = date;
                          });
                          fetchSessions(page: 1);
                        }
                      },
                      child: Text(endDateFilter != null 
                        ? 'End: ${endDateFilter!.toLocal().toString().split(' ')[0]}'
                        : 'Select End Date'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Sessions List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : sessions.isEmpty
                    ? Center(child: Text('No sessions found'))
                    : ListView.builder(
                        itemCount: sessions.length,
                        itemBuilder: (context, index) {
                          final session = sessions[index];
                          return Card(
                            margin: EdgeInsets.all(8.0),
                            child: ListTile(
                              title: Text('Event: ${session['eventType']}'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Device: ${session['userDevice']?['deviceInfo'] ?? 'Unknown'}'),
                                  Text('Date: ${DateTime.parse(session['createdAt']).toLocal()}'),
                                  if (session['location']?['coordinates']?.length > 0)
                                    Text('Location: ${session['location']['coordinates'].join(', ')}'),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          
          // Pagination Controls
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: pagination['currentPage'] > 1 && !isLoading
                      ? () => fetchSessions(page: pagination['currentPage'] - 1)
                      : null,
                  child: Text('Previous'),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Text(
                    'Page ${pagination['currentPage']} of ${pagination['totalPages']}',
                  ),
                ),
                ElevatedButton(
                  onPressed: pagination['hasMore'] && !isLoading
                      ? () => fetchSessions(page: pagination['currentPage'] + 1)
                      : null,
                  child: Text('Next'),
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

## Best Practices

1. **Caching**: Consider caching session history data to reduce API calls.
2. **Error Handling**: Implement proper error handling for API failures.
3. **Loading States**: Show loading indicators during API requests.
4. **Debouncing**: For date filters, implement debouncing to prevent excessive API calls.
5. **Infinite Scroll**: Consider implementing infinite scroll instead of pagination buttons for a better mobile experience.

## Event Types

The API supports filtering by the following event types:
- `login`: User login events
- `logout`: User logout events
- `signup`: User registration events
- `forgotPassword`: Password reset requests
- `resetPassword`: Password reset completions
- `emailVerification`: Email verification events
- `phoneVerification`: Phone verification events
- `changePassword`: Password change events

## Response Status Codes

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error