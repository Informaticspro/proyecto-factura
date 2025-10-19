package com.informaticsproservices.factura;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.community.database.sqlite.CapacitorSQLitePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🔹 Registrar manualmente el plugin SQLite
        registerPlugin(CapacitorSQLitePlugin.class);
    }
}
