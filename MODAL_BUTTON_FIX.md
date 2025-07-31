# Modal Button Layout Fix for Small Screens

## Problem
In the SBM-Rohtak React Native app, the attendance and task report modal buttons were getting pushed out of view on small screen devices. This occurred because:

1. Modal content was not properly constrained to leave space for buttons
2. ScrollView containers were taking up too much space
3. Flexbox layout wasn't optimized for small devices

## Solution
Applied comprehensive layout fixes to both modal components:

### LocationSubmissionModal.tsx
- **Layout Structure**: Added `contentContainer` wrapper with `flex: 1` and `minHeight: 0` to ensure proper space distribution
- **Content Constraints**: Limited `imageContainer` max height to 180px (small) / 280px (normal) devices
- **Button Container**: Added `flexShrink: 0` and `marginTop` to keep buttons always visible
- **Responsive Adjustments**: Made button padding, font sizes, and heights responsive to device size
- **ScrollView**: Removed fixed maxHeight, now uses flex properly with `contentContainerStyle`

### MultiImageLocationSubmissionModal.tsx
- **Layout Structure**: Similar `contentContainer` wrapper for proper flex behavior
- **Image Constraints**: Limited `imageWrapper` max height to 150px (small) / 200px (normal) devices
- **Button Layout**: Changed to column layout on small devices with reduced gaps
- **Content Optimization**: Made badges, remove buttons, and info text smaller on small devices
- **ScrollView**: Added proper `imagesContainerContent` style for better scrolling behavior

## Key Changes

### Modal Container
```tsx
modalContainer: {
  // ... existing styles
  flexDirection: 'column', // Ensure proper flex layout
}
```

### Content Container (New)
```tsx
contentContainer: {
  flex: 1,
  minHeight: 0, // Important for flex children
}
```

### Button Container
```tsx
buttonContainer: {
  flexDirection: SIZES.IS_SMALL_DEVICE ? 'column' : 'row',
  gap: SIZES.IS_SMALL_DEVICE ? SIZES.MARGIN_SMALL : SIZES.MARGIN_MEDIUM,
  flexShrink: 0, // Prevent buttons from shrinking
  marginTop: SIZES.MARGIN_SMALL,
}
```

### Responsive Button Styling
```tsx
button: {
  paddingVertical: SIZES.IS_SMALL_DEVICE ? SIZES.PADDING_SMALL : SIZES.PADDING_MEDIUM,
  minHeight: SIZES.IS_SMALL_DEVICE ? SIZES.BUTTON_HEIGHT_SMALL : SIZES.BUTTON_HEIGHT_MEDIUM,
}
```

## Impact
- ✅ Buttons now stay visible on all screen sizes
- ✅ Content scrolls properly when needed
- ✅ Better space utilization on small devices
- ✅ Improved touch targets and accessibility
- ✅ Maintains visual hierarchy and usability

## Testing
The fixes ensure that even on very small devices (< 375px width), the modal buttons remain accessible and the content scrolls appropriately without pushing buttons out of view.
