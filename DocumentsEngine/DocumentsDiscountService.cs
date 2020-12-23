using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

namespace DocumentsEngine
{
    public class DocumentsDiscountService
    { 
        public void StartMakingDiscounts()
        {
            // I don't know if this actually ran by the dependency injection or nor. 
            var storage = new MemoryStorage();

            while (true)
            {
                var docIds = storage.GetAllDocumentsIds();
                foreach (var id in docIds)
                {
                    // ToDo: make document discount with amount of 11 only if the amount after the update will be valid
                    storage.DocumentAmountDiscount(id, 11);

                }
                Thread.Sleep(3000);
            }
        }

        public void StartMakingOneDiscount()
        {
            var storage = new MemoryStorage();

            while (true)
            {
                var docIds = storage.GetAllDocumentsIds();
                foreach (var id in docIds)
                {
                    
                    storage.DocumentAmountDiscount(id, 11, 2);

                }
                Thread.Sleep(3000);
            }
        }


    }
}
