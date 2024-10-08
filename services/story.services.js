const Story = require('../models/Story');

exports.uploadStory = async ({ userId, spotId, content }) => {
    const newStory = new Story({ user: userId, spot: spotId, content });
    await newStory.save();
    return newStory;
};

exports.displayStory = async (storyId) => {
    const story = await Story.findById(storyId).populate('user').populate('spot');
    if (!story) throw new Error('Story not found');
    
    return story.displayContent();
};
