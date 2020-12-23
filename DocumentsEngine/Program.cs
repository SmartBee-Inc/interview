using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting;
using System;
using System.Threading.Tasks;

namespace DocumentsEngine
{
    class Program
    {
        /// <summary>
        /// The system you are implementing has two main roles:
        ///     1. Provide the client to update/add/get documents data. in order to do that you need to
        ///         1.1. Implement MemoryStorage
        ///         1.2. Build ASP.NET service which provides this. Notice that you can have about 1K calls in a second + the MemoryStorage sometimes crushes on saving the docs
        ///         1.3. Make changes so it wil be very easily to replace MemoryStorage with other kind of storage which implements the same methods(no need to write different storage implementation)
        ///         1.4. write unit tests + mocks to MemoryStorage
        ///     2. Implement StartMakingDiscounts in DocumentsDiscountService. This service responsible for making discounts to all documents every x seconds.
        ///     3. When your service starts, call the StartMakingDiscounts so it will continue making dicounts as long as your whole service lives
        ///     4. Copy the method StartMakingDiscounts at the same class and call it StartMakingOneDiscount. The responsibilty of the method will be to make
        ///        discounts only to documents which were updated in our storage two times. You can make changes in your data contracts and your MemoryStorage for this implementation.
        ///     4. Good Luck!!!
        /// </summary>
        /// <param name="args"></param>
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
