package com.itswesus.portal;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Aguarda a inicialização da WebView do Capacitor
        this.bridge.getWebView().post(new Runnable() {
            @Override
            public void run() {
                // 1. DESATIVAR BARRAS DE ROLAGEM NATIVAS (Apenas as duas funções oficiais)
                bridge.getWebView().setHorizontalScrollBarEnabled(false);
                bridge.getWebView().setVerticalScrollBarEnabled(false);

                // 2. BLINDAGEM DE TOQUE (Impedir popup de seleção do Android)
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