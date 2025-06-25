const { withMainActivity, createRunOncePlugin } = require('@expo/config-plugins');

const requiredImports = [
  'import android.os.Build',
  'import android.os.Bundle',
  'import android.view.View',
  'import androidx.core.view.ViewCompat',
  'import androidx.core.view.WindowInsetsCompat',
  'import androidx.core.view.updatePadding',
];

const customInsetHandler = `
    if (Build.VERSION.SDK_INT >= 35) {
        val rootView = findViewById<View>(android.R.id.content)

        ViewCompat.setOnApplyWindowInsetsListener(rootView) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                        or WindowInsetsCompat.Type.displayCutout()
                        or WindowInsetsCompat.Type.ime()
            )
            rootView.updatePadding(
                left = bars.left,
                top = bars.top,
                right = bars.right,
                bottom = bars.bottom
            )
            WindowInsetsCompat.CONSUMED
        }
    }
`;

const withCustomMainActivity = (config) => {
  return withMainActivity(config, (mod) => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('MainActivity must be written in Kotlin for this plugin.');
    }

    let contents = mod.modResults.contents;

    // Add missing imports
    const packageLineMatch = contents.match(/^package\s+[^\n]+\n/);
    if (packageLineMatch) {
      const packageLine = packageLineMatch[0];
      for (const imp of requiredImports) {
        if (!contents.includes(imp)) {
          contents = contents.replace(packageLine, packageLine + imp + '\n');
        }
      }
    }

    // Inject inside onCreate(), right after super.onCreate(null)
    // Match the full onCreate method
    const onCreateMethodRegex = /override fun onCreate\(savedInstanceState: Bundle\?\) \{([\s\S]*?)^\s*}/m;

    // If the method exists and doesn't already contain a custom ViewCompat.setOnApplyWindowInsetsListener, inject it
    if (onCreateMethodRegex.test(contents) && !contents.includes('ViewCompat.setOnApplyWindowInsetsListener')) {
      contents = contents.replace(onCreateMethodRegex, (match, body) => {
        // Inject after super.onCreate(null)
        const modifiedBody = body.replace(
          /super\.onCreate\(null\);?/,
          (superLine) => `${superLine}\n${customInsetHandler}`
        );

        return `override fun onCreate(savedInstanceState: Bundle?) {\n${modifiedBody}\n}`;
      });
    }

    mod.modResults.contents = contents;
    return mod;
  });
};

module.exports = createRunOncePlugin(
  withCustomMainActivity,
  'keyboard-inset-main-activity-listener-plugin',
  '0.0.1'
);
