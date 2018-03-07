using System;
using System.Windows.Forms;
using TweetDuck.Core.Controls;
using TweetDuck.Core.Other.Analytics;

namespace TweetDuck.Core.Other.Settings.Dialogs{
    sealed partial class DialogSettingsAnalytics : Form{
        public string CefArgs => textBoxReport.Text;

        #pragma warning disable CS8618 // nullable references
        public DialogSettingsAnalytics(AnalyticsReport report){
        #pragma warning restore CS8618
            InitializeComponent();
            
            Text = Program.BrandName+" Options - Analytics Report";
            
            textBoxReport.EnableMultilineShortcuts();
            textBoxReport.Text = report.ToString().TrimEnd();
            textBoxReport.Select(0, 0);
        }

        private void btnClose_Click(object sender, EventArgs e){
            Close();
        }
    }
}
