using System;
using System.Collections.Generic;
using System.Text;

namespace DocumentsEngine
{
    public class Document
    {
        public int Id { get; set; }

        public string Title { get; set; }

        public decimal TotalAmount { get; set; }

        // Seems to me that this is requiered, but I would probably have used a wrapper instead. 
        public int UpdateCounter { get; private set; } = 0;

        public void Updated()
        {
            this.UpdateCounter++;
        }

        public Document ShallowCopy()
        {
            return (Document)this.MemberwiseClone();
        }

    }
}
