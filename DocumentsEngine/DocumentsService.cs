using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace DocumentsEngine
{

    public interface IDocumentsService
    {
        public void add(Document document);
        public void update(Document document);
        public Document get(int Id);
        public bool delete(int Id);
        public List<Document> listDocuments();
    }


    public class DocumentsService : IDocumentsService
    {

        private MemoryStorage _ms = new MemoryStorage();
        Thread _discountThread;

        // All these threads should be Tasks if the tasks are green N:M threads, and the threads are system threads. 
        // Otherwise I'll have 1k threads, which can explode on 32bit (and a bad thing in any case).
        // But it's Thread.Sleep and not Task.Delay in the "add lag", so going with threads.
        public DocumentsService()
        {
            DocumentsDiscountService ds = new DocumentsDiscountService();
            _discountThread = new Thread(new ThreadStart(ds.StartMakingDiscounts));
            _discountThread.Start();
        }

        ~DocumentsService()
        {
            //_discountThread.Abort();
        }

        private void _addRetry(Document document)
        {
            // Fancy locks on discount update, but someone can just keep the reference and update it from outside the service?
            // Can create the documents in the Service instead. 
            var newDocument = document.ShallowCopy();
            int counter = 0;
            bool success;
            do
            {
                success = true;
                try
                {
                    _ms.SaveDocument(newDocument);
                }
                catch
                {
                    success = false;
                    counter++;
                    Task.Delay(counter * 100);
                }
            } while (success == false && counter < 20);
        }

        public void add(Document document)
        {
            Task task = new Task(() => _addRetry(document) );
            task.Start();
        }

        public Document get(int Id)
        {
            Task<Document> task = new Task<Document>(() => { return _ms.GetDocument(Id); });
            task.Start();
            return task.Result;
        }

        public void update(Document document)
        {
            Task task = new Task(() => _ms.UpdateDocument(document));
            task.Start();
        }

        public bool delete(int Id)
        {
            Task<bool> task = new Task<bool>(() => { return _ms.DeleteDocument(Id); });
            task.Start();
            return task.Result;
        }

        // In general this is the more interesting signature, it allows a "delete all that match the fields" implementation for example. 
        // Not used
        public bool delete(Document document)
        {
            return _ms.DeleteDocument(document.Id);
        }

        public List<Document> listDocuments()
        {
            Task<List<Document>> task = new Task<List<Document>>(() => { return _ms.GetAllDocuments(); });
            task.Start();
            return task.Result;
        }

    }
}
