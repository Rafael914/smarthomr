# Voice Command Feature Documentation

## Overview
The voice command feature allows users to control outlets/relays using voice commands in the SmartHome app. Users can say commands like "outlet1 on" or "relay 2 off" to control their outlets.

## Features

### Supported Commands
The system recognizes various voice command formats:

1. **Simple Format**: `outlet1 on`, `relay 2 off`
2. **Turn Format**: `turn on outlet 3`, `turn off relay 4`
3. **Extended Format**: `outlet 1 is on`, `relay 2 to off`

### Supported Outlets
- **Outlet 1** (Relay 1): Living Area
- **Outlet 2** (Relay 2): Kitchen / Dining
- **Outlet 3** (Relay 3): Master Bedroom
- **Outlet 4** (Relay 4): Media Room
- **Outlet 5** (Relay 5): Front Balcony

## Implementation

### Files Created/Modified

#### 1. `frontend/hooks/useVoiceCommand.ts` (NEW)
Hook that handles voice command logic:
- **parseVoiceCommand()**: Parses voice text to extract outlet number and action
- **executeRelayCommand()**: Sends API request to backend to execute command
- **useVoiceCommand()**: React hook providing voice command state and methods

#### 2. `frontend/components/bluePrint.tsx` (MODIFIED)
- Added import for `useVoiceCommand` hook
- Added voice command button UI with mic icon
- Added visual feedback (listening state)
- Added hint text showing example commands

### Key Functions

#### parseVoiceCommand(text: string)
Converts voice text to a structured command. Returns:
```typescript
{
  relayNumber: 1-5,
  action: 'on' | 'off'
}
```

#### executeRelayCommand(command: RelayCommand)
Sends POST request to backend API:
```
POST /api/relay
{
  "relay{number}": true|false
}
```

#### useVoiceCommand() Hook
Returns:
- `isListening`: Boolean indicating if listening for commands
- `transcript`: Current voice text
- `error`: Any error message
- `lastCommand`: Last executed command
- `startListening()`: Begins listening for voice input
- `stopListening()`: Stops listening
- `processVoiceCommand()`: Process voice text

## Usage

### In Components
```typescript
import { useVoiceCommand } from '@/hooks/useVoiceCommand';

function MyComponent() {
  const { isListening, startListening, processVoiceCommand } = useVoiceCommand();
  
  return (
    <TouchableOpacity onPress={startListening}>
      <Text>{isListening ? 'Listening...' : 'Start Voice Command'}</Text>
    </TouchableOpacity>
  );
}
```

### User Experience
1. User taps the "🎤 VOICE COMMAND" button
2. Button shows "LISTENING..." with red highlight
3. App prompts user to say command (currently via alert)
4. User says command like "outlet1 on"
5. Command is parsed and executed
6. Confirmation alert shows which outlet was controlled

## Future Enhancements

### Potential Improvements
1. **Real Voice Recognition**: Integrate actual speech-to-text API:
   - Use `expo-speech-recognition` for native voice
   - Use Google Cloud Speech API for accuracy
   - Use Azure Speech Services

2. **Advanced Features**:
   - Multi-command sequences: "turn on outlets 1, 2, and 3"
   - Conditional commands: "turn on all outlets except 2"
   - Voice profiles: Different commands for different users
   - Command history and replay

3. **UI Improvements**:
   - Real-time transcription display
   - Waveform animation while listening
   - Voice confidence score
   - Multiple language support

4. **Backend Integration**:
   - Log voice commands for security
   - Voice authentication
   - Command scheduling: "turn on outlet1 in 30 minutes"

## Testing

### Manual Testing Steps
1. Open the app and navigate to the outlets/dashboard view
2. Tap the voice command button
3. Enter command: "outlet1 on"
4. Verify outlet 1 lights up on the blueprint
5. Enter command: "relay 2 off"
6. Verify outlet 2 turns off

### Edge Cases
- Invalid outlet number: "outlet6 on" → Error message
- Invalid action: "outlet1 maybe" → Error message
- Multiple commands in one phrase: Currently processes first match
- Background noise: Might misinterpret commands

## API Requirements

Backend must support:
```
GET /api/relay - Get current relay states
POST /api/relay - Update relay states with JSON body
```

## Installation

No additional npm packages required for current implementation. For future voice recognition:
```bash
npm install expo-speech-recognition
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Voice button not responding | Check if useVoiceCommand hook is imported |
| Commands not working | Verify backend API URL (BASE_URL) |
| Commands not understood | Use exact format: "outlet{1-5} {on/off}" |
| API errors | Check backend is running at 192.168.137.1:8000 |

## Code Quality Notes
- TypeScript interfaces for type safety
- Error handling with user-friendly alerts
- Modular hook design for reusability
- Consistent styling with app theme
