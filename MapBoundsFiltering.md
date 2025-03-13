# Map Bounds Filtering Implementation Guide for Flutter

This guide explains how to implement map bounds filtering in your Flutter application for the SPOTT backend.

## 1. Models

First, create the necessary models to handle coordinates and bounds:

```dart
// lib/models/map/coordinate.dart
class Coordinate {
  final double lat;
  final double lng;

  Coordinate({required this.lat, required this.lng});

  Map<String, dynamic> toJson() => {
        'lat': lat,
        'lng': lng,
      };

  factory Coordinate.fromJson(Map<String, dynamic> json) => Coordinate(
        lat: json['lat'] as double,
        lng: json['lng'] as double,
      );
}

// lib/models/map/bounds.dart
class MapBounds {
  final Coordinate sw;
  final Coordinate ne;

  MapBounds({required this.sw, required this.ne});

  Map<String, dynamic> toJson() => {
        'sw': sw.toJson(),
        'ne': ne.toJson(),
      };

  factory MapBounds.fromJson(Map<String, dynamic> json) => MapBounds(
        sw: Coordinate.fromJson(json['sw']),
        ne: Coordinate.fromJson(json['ne']),
      );

  // Helper method to create bounds from Google Maps LatLngBounds
  factory MapBounds.fromGoogleMapBounds(LatLngBounds bounds) => MapBounds(
        sw: Coordinate(
          lat: bounds.southwest.latitude,
          lng: bounds.southwest.longitude,
        ),
        ne: Coordinate(
          lat: bounds.northeast.latitude,
          lng: bounds.northeast.longitude,
        ),
      );
}
```

## 2. API Service

Create a service to handle the API calls:

```dart
// lib/services/spot_service.dart
class SpotService {
  final dio = Dio(); // Configure with your base URL and interceptors

  Future<SpotResponse> getFilteredSpots({
    required MapBounds bounds,
    List<MapBounds>? excludeBounds,
    Map<String, dynamic>? additionalFilters,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        'bounds': jsonEncode(bounds.toJson()),
        if (excludeBounds != null && excludeBounds.isNotEmpty)
          'excludeBounds': jsonEncode(excludeBounds.map((b) => b.toJson()).toList()),
        ...?additionalFilters,
      };

      final response = await dio.get(
        '/spots',
        queryParameters: queryParams,
      );

      return SpotResponse.fromJson(response.data);
    } catch (e) {
      // Handle errors appropriately
      rethrow;
    }
  }
}
```

## 3. Map Controller Implementation

Create a controller to manage map state and filtering:

```dart
// lib/controllers/map_controller.dart
class MapController extends GetxController {
  final _spotService = SpotService();
  final spots = <Spot>[].obs;
  final isLoading = false.obs;
  final currentBounds = Rxn<MapBounds>();
  final excludedBounds = <MapBounds>[].obs;
  
  // Current visible region on the map
  GoogleMapController? _mapController;
  
  // Additional filters
  final additionalFilters = <String, dynamic>{}.obs;

  Future<void> onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    // Initial load if bounds are set
    if (currentBounds.value != null) {
      loadSpots();
    }
  }

  Future<void> onCameraMove(CameraPosition position) {
    // Debounce this method to prevent too many API calls
    _debouncer.run(() async {
      if (_mapController != null) {
        final bounds = await _mapController!.getVisibleRegion();
        currentBounds.value = MapBounds.fromGoogleMapBounds(bounds);
        loadSpots();
      }
    });
  }

  Future<void> loadSpots() async {
    if (currentBounds.value == null) return;

    try {
      isLoading.value = true;
      
      final response = await _spotService.getFilteredSpots(
        bounds: currentBounds.value!,
        excludeBounds: excludedBounds,
        additionalFilters: additionalFilters,
      );
      
      spots.value = response.spots;
    } catch (e) {
      // Handle errors
    } finally {
      isLoading.value = false;
    }
  }

  void addExcludedBound(MapBounds bound) {
    excludedBounds.add(bound);
    loadSpots(); // Reload with new excluded bound
  }

  void removeExcludedBound(MapBounds bound) {
    excludedBounds.remove(bound);
    loadSpots(); // Reload without the excluded bound
  }

  void updateFilters(Map<String, dynamic> newFilters) {
    additionalFilters.value = newFilters;
    loadSpots(); // Reload with new filters
  }
}
```

## 4. Map Widget Implementation

Create the map widget that uses the controller:

```dart
// lib/widgets/spot_map.dart
class SpotMap extends StatelessWidget {
  final controller = Get.put(MapController());

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Obx(() => GoogleMap(
          onMapCreated: controller.onMapCreated,
          onCameraMove: controller.onCameraMove,
          markers: _buildMarkers(),
          initialCameraPosition: CameraPosition(
            target: LatLng(6.5244, 3.3792), // Lagos coordinates
            zoom: 13,
          ),
          // Add other map configurations
        )),
        
        // Loading indicator
        Obx(() => controller.isLoading.value
          ? Center(child: CircularProgressIndicator())
          : SizedBox.shrink()),
          
        // Filter button
        Positioned(
          top: 16,
          right: 16,
          child: FilterButton(
            onFilterApplied: controller.updateFilters,
          ),
        ),
      ],
    );
  }

  Set<Marker> _buildMarkers() {
    return controller.spots.map((spot) => Marker(
      markerId: MarkerId(spot.id),
      position: LatLng(
        spot.location.coordinates[1],
        spot.location.coordinates[0],
      ),
      infoWindow: InfoWindow(
        title: spot.name,
        snippet: spot.type,
      ),
      onTap: () => _onMarkerTapped(spot),
    )).toSet();
  }

  void _onMarkerTapped(Spot spot) {
    // Show spot details bottom sheet
    Get.bottomSheet(SpotDetailsSheet(spot: spot));
  }
}
```

## 5. Filter Implementation

Create a filter widget to handle additional filters:

```dart
// lib/widgets/filter_button.dart
class FilterButton extends StatelessWidget {
  final Function(Map<String, dynamic>) onFilterApplied;

  const FilterButton({required this.onFilterApplied});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      child: Icon(Icons.filter_list),
      onPressed: () => _showFilterSheet(context),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (_) => FilterSheet(
        onApply: onFilterApplied,
      ),
    );
  }
}

// lib/widgets/filter_sheet.dart
class FilterSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onApply;

  @override
  _FilterSheetState createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  final filters = <String, dynamic>{};

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          // Type filter
          DropdownButton<String>(
            hint: Text('Select Type'),
            value: filters['type'],
            items: ['restaurant', 'club', 'bar', 'lounge', 'cafe', 'beach']
                .map((type) => DropdownMenuItem(
                      value: type,
                      child: Text(type.capitalize!),
                    ))
                .toList(),
            onChanged: (value) => setState(() => filters['type'] = value),
          ),

          // Budget range filter
          RangeSlider(
            values: RangeValues(
              filters['minBudget'] ?? 0,
              filters['maxBudget'] ?? 1000000,
            ),
            min: 0,
            max: 1000000,
            divisions: 100,
            labels: RangeLabels(
              '₦${filters['minBudget'] ?? 0}',
              '₦${filters['maxBudget'] ?? 1000000}',
            ),
            onChanged: (values) => setState(() {
              filters['minBudget'] = values.start;
              filters['maxBudget'] = values.end;
            }),
          ),

          // Add more filters as needed

          ElevatedButton(
            onPressed: () {
              widget.onApply(filters);
              Navigator.pop(context);
            },
            child: Text('Apply Filters'),
          ),
        ],
      ),
    );
  }
}
```

## 6. Usage Example

Here's how to use the map in your screen:

```dart
// lib/screens/map_screen.dart
class MapScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Explore Spots')),
      body: SpotMap(),
    );
  }
}
```

## 7. Best Practices

1. **Debouncing**
   - Implement debouncing for map movements to prevent excessive API calls:
```dart
class Debouncer {
  final Duration delay;
  Timer? _timer;

  Debouncer({this.delay = const Duration(milliseconds: 500)});

  void run(Function action) {
    _timer?.cancel();
    _timer = Timer(delay, () => action());
  }

  void dispose() {
    _timer?.cancel();
  }
}
```

2. **Error Handling**
   - Implement proper error handling for network requests:
```dart
try {
  await controller.loadSpots();
} catch (e) {
  Get.snackbar(
    'Error',
    'Failed to load spots. Please try again.',
    snackPosition: SnackPosition.BOTTOM,
  );
}
```

3. **Loading States**
   - Show appropriate loading indicators
   - Implement skeleton loading for spots
   - Add pull-to-refresh functionality

4. **Caching**
   - Cache spot data for previously viewed regions
   - Implement local storage for filters
   - Cache map tiles for offline use

5. **Performance**
   - Use markers clustering for large datasets
   - Implement virtual scrolling for spot lists
   - Optimize marker rendering

## 8. Additional Features

1. **Marker Clustering**
```dart
// Add marker clustering to handle many spots
final _clusterManager = ClusterManager<Spot>(
  spots,
  _updateMarkers,
  markerBuilder: _markerBuilder,
  levels: [1, 4.25, 6.75, 8.25, 11.5, 14.5, 16.0, 16.5, 20.0],
);
```

2. **Custom Info Windows**
```dart
// Implement custom info windows for better UX
CustomInfoWindow(
  controller: _customInfoWindowController,
  height: 75,
  width: 150,
  offset: 50,
)
```

3. **Location Services**
```dart
// Add current location functionality
final location = Location();
final permission = await location.requestPermission();
if (permission == PermissionStatus.granted) {
  final currentLocation = await location.getLocation();
  _mapController?.animateCamera(
    CameraUpdate.newLatLng(
      LatLng(currentLocation.latitude!, currentLocation.longitude!),
    ),
  );
}
```

## 9. Testing

```dart
void main() {
  group('MapController Tests', () {
    test('should update bounds correctly', () {
      final controller = MapController();
      final bounds = MapBounds(
        sw: Coordinate(lat: 6.4, lng: 3.3),
        ne: Coordinate(lat: 6.6, lng: 3.4),
      );
      
      controller.currentBounds.value = bounds;
      
      expect(controller.currentBounds.value?.sw.lat, 6.4);
      expect(controller.currentBounds.value?.ne.lng, 3.4);
    });
    
    // Add more tests
  });
}
``` 