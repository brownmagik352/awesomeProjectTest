package com.keepintouch;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.sbugert.rnadmob.RNAdMobPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.rollbar.RollbarReactNative;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.tkporter.sendsms.SendSMSPackage; // react-native-sms

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNAdMobPackage(),
            new SplashScreenReactPackage(),
            RollbarReactNative.getPackage(),
            new ReactNativePushNotificationPackage(),
            new ReactNativeContacts(),
            SendSMSPackage.getInstance() //react-native-sms
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    RollbarReactNative.init(this, "fc49b7778b5e44d387ca4005cd43726d", "production");
  }
}
