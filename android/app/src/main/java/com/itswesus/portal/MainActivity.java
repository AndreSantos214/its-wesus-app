package com.itswesus.portal;

import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. INJEÇÃO DA PONTE NATIVISTA DE SINTONIA DE CORES (Anti-Crash)
        this.bridge.getWebView().addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void setSystemBarsColor(final String colorHex, final boolean isDark) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                            int color = android.graphics.Color.parseColor(colorHex);
                            // Altera a cor da barra inferior (Voltar/Home/Abas)
                            getWindow().setNavigationBarColor(color);
                            // Altera a cor da barra superior (Bateria/Hora/Sinal)
                            getWindow().setStatusBarColor(color);
                            
                            // Controle de contraste dos ícones nativos (Android 8.0+)
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                                View decorView = getWindow().getDecorView();
                                int flags = decorView.getSystemUiVisibility();
                                if (!isDark) {
                                    // Tema Claro: Força os botões/ícones nativos a ficarem escuros
                                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                        flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                                    }
                                } else {
                                    // Tema Escuro: Ícones nativos ficam brancos/claros
                                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                                    }
                                }
                                decorView.setSystemUiVisibility(flags);
                            }
                        }
                    }
                });
            }
        }, "AndroidInterface");

        // Aguarda a inicialização da WebView do Capacitor
        this.bridge.getWebView().post(new Runnable() {
            @Override
            public void run() {
                // 1. DESATIVAR BARRAS DE ROLAGEM NATIVAS
                bridge.getWebView().setHorizontalScrollBarEnabled(false);
                bridge.getWebView().setVerticalScrollBarEnabled(false);

                // 2. BLINDAGEM DE TOQUE
                bridge.getWebView().setOnLongClickListener(new View.OnLongClickListener() {
                    @Override
                    public boolean onLongClick(View v) {
                        return true; 
                    }
                });
            }
        });
    }
}