class FpnvSigninExample {
    interface FPNVTokenExchangeService {
        @POST("signInWithFpnv")
        suspend fun signInWithFpnv(@Body fpnvToken: String): String
    }

    val retrofit = Retrofit.Builder()
        .baseUrl("https://example-project.cloudfunctions.net/")
        .build()
    val service: FPNVTokenExchangeService = retrofit.create(FPNVTokenExchangeService::class.java)

    suspend fun signInWithFpnvToken(fpnvToken: String): Task<AuthResult?> = coroutineScope {
        val authToken = service.signInWithFpnv(fpnvToken)
        return@coroutineScope Firebase.auth.signInWithCustomToken(authToken)
    }
}