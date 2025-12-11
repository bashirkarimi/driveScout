# Lead Form Visual Preview

## 📱 User Interface Screenshots (Described)

### 1. Vehicle Detail Card with "Book Test Drive" Button

```
┌────────────────────────────────────────────────────────┐
│  [Close X]                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [Image Carousel - Vehicle Photos]                    │
│                                                        │
├────────────────────────────────────────────────────────┤
│  2024 Tesla Model 3 Long Range                        │
│  AWD • Premium Interior                               │
│                                                        │
│  $47,990                                              │
│  $699/month with financing                            │
│  ✓ Financing available                               │
├────────────────────────────────────────────────────────┤
│  Description                                          │
│  Experience the future of driving with Tesla's...    │
│                                                        │
│  Vehicle Highlights                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │ ENGINE  │ │  POWER  │ │  RANGE  │                │
│  │ Electric│ │ 346 HP  │ │ 358 mi  │                │
│  └─────────┘ └─────────┘ └─────────┘                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │  YEAR   │ │ MILEAGE │ │  TRANS  │                │
│  │  2024   │ │ 5,234mi │ │  Auto   │                │
│  └─────────┘ └─────────┘ └─────────┘                │
├────────────────────────────────────────────────────────┤
│  Location                                             │
│  Tesla Dealership San Francisco                       │
│  San Francisco, CA • 5 km away                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  📅  Book Test Drive  [GREEN BUTTON]         │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  View Full Details at Tesla.com              │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Listed on Nov 28, 2024                              │
└────────────────────────────────────────────────────────┘
```

### 2. Lead Form Modal (Initial State)

```
┌────────────────────────────────────────────────────────┐
│  Book Test Drive                            [Close X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  2024 Tesla Model 3 Long Range              │    │
│  │  AWD • Premium Interior                     │    │
│  │  $47,990                                    │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  First Name *           Last Name *                   │
│  ┌─────────────────┐   ┌─────────────────┐          │
│  │ John            │   │ Doe             │          │
│  └─────────────────┘   └─────────────────┘          │
│                                                        │
│  Email *                                              │
│  ┌──────────────────────────────────────────┐        │
│  │ john.doe@example.com                     │        │
│  └──────────────────────────────────────────┘        │
│                                                        │
│  Phone Number *                                       │
│  ┌──────────────────────────────────────────┐        │
│  │ +1 (555) 123-4567                        │        │
│  └──────────────────────────────────────────┘        │
│                                                        │
│  Message (Optional)                                   │
│  ┌──────────────────────────────────────────┐        │
│  │ I'm interested in scheduling a test      │        │
│  │ drive for this weekend. Do you have      │        │
│  │ availability on Saturday morning?        │        │
│  └──────────────────────────────────────────┘        │
│                                                        │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ Submit Request   │  │     Cancel       │         │
│  └──────────────────┘  └──────────────────┘         │
│                                                        │
│  By submitting this form, you agree to be contacted  │
│  by the dealer regarding this vehicle.               │
└────────────────────────────────────────────────────────┘
```

### 3. Lead Form with Validation Errors

```
┌────────────────────────────────────────────────────────┐
│  Book Test Drive                            [Close X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Email *                                              │
│  ┌──────────────────────────────────────────┐        │
│  │ invalid-email                            │  ← Red │
│  └──────────────────────────────────────────┘        │
│  ⚠️ Please enter a valid email                        │
│                                                        │
│  Phone Number *                                       │
│  ┌──────────────────────────────────────────┐        │
│  │ 123                                      │  ← Red │
│  └──────────────────────────────────────────┘        │
│  ⚠️ Please enter a valid phone number                │
└────────────────────────────────────────────────────────┘
```

### 4. Lead Form Submitting State

```
┌────────────────────────────────────────────────────────┐
│  Book Test Drive                            [Close X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [All form fields filled correctly]                   │
│                                                        │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │ ⟳ Sending...     │  │  Cancel (disabled)│         │
│  └──────────────────┘  └──────────────────┘         │
│  [Spinner animation showing]                          │
└────────────────────────────────────────────────────────┘
```

### 5. Success Confirmation

```
┌────────────────────────────────────────────────────────┐
│                                              [Close X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│                    ┌─────────┐                        │
│                    │    ✅   │  [Green circle]        │
│                    └─────────┘                        │
│                                                        │
│              Request Sent!                            │
│                                                        │
│  Thank you for your interest in the 2024 Tesla       │
│  Model 3 Long Range. A dealer representative will    │
│  contact you shortly.                                 │
│                                                        │
│                                                        │
│  [Auto-closes in 2 seconds]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Primary Colors
- **Elm Green**: `#10b981` (Button primary, success states)
- **Elm Dark**: `#059669` (Hover states)
- **Elm Light**: `#d1fae5` (Background accents)

### Secondary Colors
- **Slate 900**: `#0f172a` (Primary text)
- **Slate 600**: `#475569` (Secondary text)
- **Slate 200**: `#e2e8f0` (Borders)
- **Slate 50**: `#f8fafc` (Light backgrounds)

### Status Colors
- **Red 500**: `#ef4444` (Errors)
- **Red 50**: `#fef2f2` (Error backgrounds)
- **Green 500**: `#22c55e` (Success)
- **Green 50**: `#f0fdf4` (Success backgrounds)

## 📐 Layout Specifications

### Form Inputs
- **Height**: 40px (2.5rem)
- **Border Radius**: 8px
- **Border**: 1px solid slate-300
- **Padding**: 8px 12px
- **Font Size**: 14px
- **Focus Ring**: 2px elm-500

### Buttons
- **Primary (Submit)**: 
  - Height: 44px (lg size)
  - Padding: 0 32px
  - Font: 16px semibold
  - Background: elm-600
  - Hover: elm-700

- **Book Test Drive**:
  - Height: 44px
  - Background: green-600
  - Icon: Calendar (20px)
  - Full width on mobile

### Spacing
- **Gap between inputs**: 16px
- **Section padding**: 24px
- **Modal max-width**: 640px
- **Mobile padding**: 16px

### Typography
- **H3 (Modal Title)**: 20px bold
- **Labels**: 14px medium
- **Input Text**: 14px regular
- **Help Text**: 12px regular
- **Error Messages**: 12px medium

## 🎭 Animations

### Form Appearance
```css
/* Modal fade in */
opacity: 0 → 1
transition: 200ms ease

/* Slide up on mobile */
transform: translateY(20px) → translateY(0)
transition: 300ms ease-out
```

### Success State
```css
/* Checkmark scale */
transform: scale(0) → scale(1)
transition: 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)

/* Green circle pulse */
animation: pulse 1s ease-in-out
```

### Loading Spinner
```css
/* Rotation */
animation: spin 1s linear infinite
```

### Error Shake
```css
/* Subtle shake on validation error */
animation: shake 0.3s ease-in-out
```

## 📱 Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Full-width buttons
- Stacked name fields
- Reduced padding (16px)
- Larger touch targets

### Tablet (640px - 1024px)
- Two-column name fields
- Comfortable spacing
- Side-by-side buttons
- 24px padding

### Desktop (> 1024px)
- Same as tablet
- Max width: 640px
- Centered modal

## ♿ Accessibility Features

### Implemented
- ✅ Semantic HTML (`<form>`, `<label>`, `<input>`)
- ✅ Required field indicators (*)
- ✅ ARIA labels on close buttons
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Focus visible states (ring)
- ✅ Error announcements
- ✅ High contrast ratios (WCAG AA)

### Focus Order
1. Close button
2. First name input
3. Last name input
4. Email input
5. Phone input
6. Message textarea
7. Submit button
8. Cancel button

## 🔍 Visual States

### Input States
- **Default**: White bg, slate border
- **Focus**: Blue ring, darker border
- **Error**: Red border, red bg, error text
- **Disabled**: Gray bg, gray text
- **Filled**: Maintains value on blur

### Button States
- **Default**: Solid color
- **Hover**: Darker shade, shadow
- **Active**: Slightly darker
- **Disabled**: 50% opacity, no pointer
- **Loading**: Spinner, disabled interaction

### Form States
- **Empty**: All fields blank
- **Partial**: Some fields filled
- **Valid**: All required fields correct
- **Submitting**: Loading state
- **Success**: Confirmation message
- **Error**: Error banner displayed

## 💻 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android

### CSS Features Used
- Flexbox (excellent support)
- CSS Grid (excellent support)
- Custom properties (excellent support)
- Transforms (excellent support)
- Transitions (excellent support)

## 📏 Example Measurements

```
Modal Container:
├─ Max Width: 640px
├─ Padding: 24px
├─ Border Radius: 12px
└─ Shadow: 0 20px 25px rgba(0,0,0,0.1)

Input Field:
├─ Height: 40px
├─ Padding: 8px 12px
├─ Border: 1px solid
├─ Border Radius: 8px
└─ Font Size: 14px

Submit Button:
├─ Height: 44px
├─ Padding: 0 32px
├─ Border Radius: 8px
└─ Font Size: 16px (semibold)

Spacing:
├─ Between inputs: 16px
├─ Section gaps: 24px
├─ Label to input: 6px
└─ Error to next input: 4px
```

## 🎯 Interactive Elements

```
Clickable Areas:
├─ Close button: 40x40px
├─ Submit button: full width (min 200px)
├─ Cancel button: full width (min 200px)
├─ Input fields: full width (min height 40px)
└─ Textarea: full width (min height 100px)

Touch Targets (Mobile):
├─ Minimum: 44x44px
├─ Close button: 48x48px
└─ Buttons: 48px height
```

This visual guide helps developers and designers understand the exact appearance and behavior of the lead form feature!
