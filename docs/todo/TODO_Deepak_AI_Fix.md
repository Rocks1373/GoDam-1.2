# AI Service Fix Plan - "Deepak" Assistant

## Changes Required

### 1. Update AISupport.tsx
- Rename "GoDAM Assistant" to "Deepak"
- Update welcome messages to be conversational
- Add user name memory (localStorage)
- Personalize responses based on stored user name

### 2. Update AppShell.tsx
- Change AI button text from "Assistant" to "Deepak"

### 3. Update CSS (optional)
- May need visual tweaks for name display

### 4. Check AI Service Status
- Verify Docker services are running
- Test health endpoint

## Implementation Steps
1. Edit AISupport.tsx with new welcome flow and name memory
2. Edit AppShell.tsx to update button label
3. Run health check on AI service
4. Test the chat functionality

## Files to Modify
- web-admin/src/components/AISupport.tsx
- web-admin/src/components/AppShell.tsx

## Expected Behavior
- First message: "Hey how you doing"
- Second message: "i am Deepak here"
- Third message: "Ready to help"
- Fourth message: "go on"
- If user says their name, store it and use it in future messages

