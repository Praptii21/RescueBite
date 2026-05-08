// bite_app/app/src/main/java/com.foodRescue/RescueBiteApp.kt
package com.foodRescue

import android.app.Application
import com.google.firebase.FirebaseApp

class RescueBiteApp : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
    }
}
