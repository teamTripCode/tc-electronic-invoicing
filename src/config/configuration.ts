export default () => ({
    dian: {
        apiUrl: process.env.DIAN_API_URL,
        softwareId: process.env.DIAN_SOFTWARE_ID,
        softwarePin: process.env.DIAN_SOFTWARE_PIN,
        testSetId: process.env.DIAN_TEST_SET_ID,
        certificatePath: process.env.DIAN_CERTIFICATE_PATH,
        certificatePassword: process.env.DIAN_CERTIFICATE_PASSWORD,
        contributorType: process.env.DIAN_CONTRIBUTOR_TYPE, // Tipo de contribuyente
        isProduction: process.env.DIAN_ENVIRONMENT === 'production',
    },
    database: {
        // Configuración de la base de datos
    },
})