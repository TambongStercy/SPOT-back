Here's a comprehensive solution implementing your requirements with optimized geo-caching and adaptive fetching:

### 1. Backend Optimization (Mongoose/MongoDB)

**a. Enhanced Query Endpoint:**
```javascript
// spots.controller.js
const getViewportSpots = async (req, res) => {
  const { bounds, excludeBounds = [], minZoom } = req.body;
  
  // Convert to MongoDB $geoWithin format
  const mainBox = [
    [bounds.sw.lng, bounds.sw.lat],
    [bounds.ne.lng, bounds.ne.lat]
  ];

  const excludeBoxes = excludeBounds.map(b => [
    [b.sw.lng, b.sw.lat],
    [b.ne.lng, b.ne.lat]
  ]);

  const query = {
    location: {
      $geoWithin: {
        $box: mainBox,
        $not: { $geoWithin: { $box: excludeBoxes } 
      }
    }
  };

  // Project only needed fields
  const projection = {
    _id: 1,
    name: 1,
    profileImage: 1,
    location: 1,
    rating: 1,
    numberOfRatings: 1,
    daysAndTimes: 1
  };

  const spots = await Spot.find(query)
    .select(projection)
    .lean();

  res.json({
    type: 'FeatureCollection',
    features: spots.map(spot => ({
      type: 'Feature',
      geometry: spot.location,
      properties: _.omit(spot, ['location'])
    }))
  });
};
```