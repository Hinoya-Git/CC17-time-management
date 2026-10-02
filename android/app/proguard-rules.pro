# ProGuard rules for TimeFlow Android App
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepclassmembers class com.timemanagement.calendar.AndroidBridge {
    <methods>;
}
