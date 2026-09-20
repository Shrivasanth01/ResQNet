package com.resqnet.sos.services.hardware

import android.location.Location
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.*

class LocationModeManagerTest {

    private lateinit var evaluator: LocationQualityEvaluator
    private lateinit var modeManager: LocationModeManager

    @Before
    fun setUp() {
        evaluator = LocationQualityEvaluator(
            config = EvaluatorConfig(
                maxAccuracyMeters = 25.0f,
                maxAgeMs = 10000L
            )
        )
        modeManager = LocationModeManager(
            context = null,
            evaluator = evaluator,
            config = ModeManagerConfig(
                gpsLossDebounceMs = 3000L,
                requiredConsecutiveGoodFixes = 2
            )
        )
    }

    @Test
    fun testQualityEvaluator_GoodFix() {
        val loc = mock(Location::class.java)
        `when`(loc.latitude).thenReturn(13.0827)
        `when`(loc.longitude).thenReturn(80.2707)
        `when`(loc.hasAccuracy()).thenReturn(true)
        `when`(loc.accuracy).thenReturn(10.0f)
        `when`(loc.time).thenReturn(System.currentTimeMillis())

        val quality = evaluator.evaluateQuality(loc)
        assertEquals(LocationQuality.GOOD, quality)
    }

    @Test
    fun testQualityEvaluator_PoorAccuracy_Rejected() {
        val loc = mock(Location::class.java)
        `when`(loc.latitude).thenReturn(13.0827)
        `when`(loc.longitude).thenReturn(80.2707)
        `when`(loc.hasAccuracy()).thenReturn(true)
        `when`(loc.accuracy).thenReturn(150.0f) // Poor accuracy > 25m
        `when`(loc.time).thenReturn(System.currentTimeMillis())

        val quality = evaluator.evaluateQuality(loc)
        assertEquals(LocationQuality.POOR, quality)
    }

    @Test
    fun testGpsAvailable_ConfirmedMode() {
        val now = System.currentTimeMillis()
        val loc = mock(Location::class.java)
        `when`(loc.latitude).thenReturn(11.6640)
        `when`(loc.longitude).thenReturn(78.1460)
        `when`(loc.hasAccuracy()).thenReturn(true)
        `when`(loc.accuracy).thenReturn(5.0f)
        `when`(loc.time).thenReturn(now)
        `when`(loc.provider).thenReturn("GPS")

        modeManager.onNewLocationFix(loc, now)

        val state = modeManager.locationState.value
        assertEquals(LocationMode.CONFIRMED, state.mode)
        assertNotNull(state.lastConfirmedLocation)
        assertEquals(11.6640, state.lastConfirmedLocation!!.latitude, 0.0001)
        assertEquals(78.1460, state.lastConfirmedLocation!!.longitude, 0.0001)
    }

    @Test
    fun testGpsUnavailable_DebouncedTransition_PdrActive() {
        val startMs = System.currentTimeMillis()
        val goodLoc = mock(Location::class.java)
        `when`(goodLoc.latitude).thenReturn(11.6640)
        `when`(goodLoc.longitude).thenReturn(78.1460)
        `when`(goodLoc.hasAccuracy()).thenReturn(true)
        `when`(goodLoc.accuracy).thenReturn(5.0f)
        `when`(goodLoc.time).thenReturn(startMs)
        `when`(goodLoc.provider).thenReturn("GPS")

        modeManager.onNewLocationFix(goodLoc, startMs)
        assertEquals(LocationMode.CONFIRMED, modeManager.locationState.value.mode)

        // Single null/bad fix at +1000ms -> should STAY CONFIRMED due to 3000ms debounce
        modeManager.onNewLocationFix(null, startMs + 1000L)
        assertEquals(LocationMode.CONFIRMED, modeManager.locationState.value.mode)

        // Null/bad fix at +3500ms -> debounce exceeded -> TRANSITION to PDR_ACTIVE
        modeManager.onNewLocationFix(null, startMs + 3500L)
        assertEquals(LocationMode.PDR_ACTIVE, modeManager.locationState.value.mode)
        assertEquals(11.6640, modeManager.locationState.value.lastConfirmedLocation!!.latitude, 0.0001)
    }

    @Test
    fun testGpsReturns_PdrStops_DisplacementResets_NewConfirmedLocationSaved() {
        val startMs = System.currentTimeMillis()
        val origLoc = mock(Location::class.java)
        `when`(origLoc.latitude).thenReturn(11.6640)
        `when`(origLoc.longitude).thenReturn(78.1460)
        `when`(origLoc.hasAccuracy()).thenReturn(true)
        `when`(origLoc.accuracy).thenReturn(5.0f)
        `when`(origLoc.time).thenReturn(startMs)
        `when`(origLoc.provider).thenReturn("GPS")

        modeManager.onNewLocationFix(origLoc, startMs)

        // Force transition to PDR_ACTIVE at +4000ms
        modeManager.onNewLocationFix(null, startMs + 4000L)
        assertEquals(LocationMode.PDR_ACTIVE, modeManager.locationState.value.mode)

        // Walk 10 steps offline
        modeManager.onPdrStepUpdate(stepCount = 10, stepLengthMeters = 0.70, headingDeg = 0f) // North
        val pdrState = modeManager.locationState.value
        assertEquals(10, pdrState.pdrStepCount)
        assertTrue(pdrState.northMeters > 0)

        // GPS returns with NEW location fix (11.6650, 78.1470) at +5000ms (1st good fix)
        val newGps = mock(Location::class.java)
        `when`(newGps.latitude).thenReturn(11.6650)
        `when`(newGps.longitude).thenReturn(78.1470)
        `when`(newGps.hasAccuracy()).thenReturn(true)
        `when`(newGps.accuracy).thenReturn(8.0f)
        `when`(newGps.time).thenReturn(startMs + 5000L)
        `when`(newGps.provider).thenReturn("GPS")

        modeManager.onNewLocationFix(newGps, startMs + 5000L)
        // 1st fix -> still PDR_ACTIVE (requires 2 consecutive good fixes)
        assertEquals(LocationMode.PDR_ACTIVE, modeManager.locationState.value.mode)

        // 2nd consecutive good fix at +6000ms
        modeManager.onNewLocationFix(newGps, startMs + 6000L)
        val resyncedState = modeManager.locationState.value

        // Verified resync: Mode = CONFIRMED, displacement = 0m, new confirmed location = (11.6650, 78.1470)
        assertEquals(LocationMode.CONFIRMED, resyncedState.mode)
        assertEquals(0.0, resyncedState.eastMeters, 0.0001)
        assertEquals(0.0, resyncedState.northMeters, 0.0001)
        assertEquals(0, resyncedState.pdrStepCount)
        assertEquals(11.6650, resyncedState.lastConfirmedLocation!!.latitude, 0.0001)
        assertEquals(78.1470, resyncedState.lastConfirmedLocation!!.longitude, 0.0001)
        assertTrue(resyncedState.isResyncedEvent)
    }
}
