﻿using System;
using System.Windows.Forms;

namespace TweetDck.Core.Controls{
    class FlatButton : Button{
        protected override bool ShowFocusCues{
            get{
                return false;
            }
        }

        public FlatButton(){
            GotFocus += FlatButton_GotFocus;
        }

        private void FlatButton_GotFocus(object sender, EventArgs e){ // removes extra border when focused
            NotifyDefault(false);
        }
    }
}
