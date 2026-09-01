# Force Emergency Contacts Registration & Fix Settings Navigation

This plan addresses two issues:
1.  Requiring new users to add emergency contacts during registration.
2.  Fixing the "Emergency Contacts" section in Settings which currently does not open.

## Proposed Changes

### [Component Name] UI & Navigation

#### [NEW] [EmergencyContactsScreen.kt](file:///C:/Users/Sam/Desktop/ResQNet/android/app/src/main/java/com/resqnet/sos/ui/screens/settings/EmergencyContactsScreen.kt)
Create a new screen to manage emergency contacts (add, remove, list).

#### [MODIFY] [ResQNetNavGraph.kt](file:///C:/Users/Sam/Desktop/ResQNet/android/app/src/main/java/com/resqnet/sos/ui/navigation/ResQNetNavGraph.kt)
Add `EmergencyContacts` route to the `Screen` sealed class.

#### [MODIFY] [MainActivity.kt](file:///C:/Users/Sam/Desktop/ResQNet/android/app/src/main/java/com/resqnet/sos/MainActivity.kt)
Register the `EmergencyContactsScreen` in the `NavHost`.

#### [MODIFY] [SettingsScreen.kt](file:///C:/Users/Sam/Desktop/ResQNet/android/app/src/main/java/com/resqnet/sos/ui/screens/settings/SettingsScreen.kt)
Update the `onClick` handler for the "Emergency Contacts" row to navigate to the new screen.

#### [MODIFY] [VerifyOtpScreen.kt](file:///C:/Users/Sam/Desktop/ResQNet/android/app/src/main/java/com/resqnet/sos/ui/screens/auth/VerifyOtpScreen.kt)
Update the post-verification logic to check if the user has personal emergency contacts. If not, navigate to `EmergencyContactsScreen` instead of `Dashboard`.

## Verification Plan

### Manual Verification
1.  **Settings Navigation:** Open the app, go to Settings, tap "Emergency Contacts", and verify it opens the new screen.
2.  **Contact Management:** Add and remove contacts on the new screen, save, and verify they are persisted (by re-opening the screen).
3.  **New User Flow:**
    *   Clear app data or logout.
    *   Perform a login/registration with OTP.
    *   Verify that if no contacts are synced from the cloud, the app redirects to the Emergency Contacts setup screen.
    *   Verify that after adding a contact, the user can proceed to the Dashboard.
