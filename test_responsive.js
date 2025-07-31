// Simple test for responsive scaling functions
function testResponsiveScaling() {
  console.log('Testing Responsive UI Scaling...\n');
  
  const deviceSizes = [
    { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
    { name: 'iPhone SE (2nd/3rd gen)', width: 375, height: 667 },
    { name: 'iPhone 8', width: 375, height: 667 },
    { name: 'iPhone 12 Pro', width: 390, height: 844 },
    { name: 'iPhone 14 Plus', width: 428, height: 926 },
  ];
  
  deviceSizes.forEach(device => {
    console.log(`\n--- ${device.name} (${device.width}x${device.height}) ---`);
    
    const { width, height } = device;
    
    // Device categorization
    const isSmallDevice = width < 375;
    const isMediumDevice = width >= 375 && width < 414;
    const isLargeDevice = width >= 414;
    
    console.log(`Device Category: ${isSmallDevice ? 'Small' : isMediumDevice ? 'Medium' : 'Large'}`);
    
    // Scaling functions
    const scale = (size) => {
      if (isSmallDevice) return Math.round(size * 0.85);
      if (isMediumDevice) return Math.round(size * 0.95);
      return Math.round(size);
    };
    
    const verticalScale = (size) => {
      const standardLength = height > width ? height : width;
      const offset = standardLength > 812 ? 0 : (standardLength < 667 ? -0.15 : -0.05);
      return Math.round(size * (1 + offset));
    };
    
    // Test sizing
    console.log(`Base Padding (16): ${scale(16)}px`);
    console.log(`Base Font Size (14): ${scale(14)}px`);
    console.log(`Button Height (44): ${verticalScale(44)}px`);
    
    // Image grid calculations
    const screenPadding = scale(16) * 2;
    const itemSpacing = scale(8) * 2;
    const columns = isSmallDevice ? 2 : 3;
    const availableWidth = width - screenPadding;
    const imageSize = (availableWidth - (itemSpacing * (columns - 1))) / columns;
    
    console.log(`Image Grid: ${columns} columns, ${Math.floor(imageSize)}px per image`);
  });
}

testResponsiveScaling();
