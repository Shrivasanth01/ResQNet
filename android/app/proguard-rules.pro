# Keep Kotlinx serialization models
-keepclassmembers class * {
    @kotlinx.serialization.Serializable *;
}
-keepclassmembers class * {
    companion <fields>;
}
-keep class kotlinx.serialization.** { *; }
