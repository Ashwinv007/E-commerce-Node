function addToCart(proId){
            $.ajax({
                url:'/add-to-cart/'+proId,
                method:'get',
                success:(response)=>{
                    if(response.status){
                        let count=$('#cart-count').html()
                        count=parseInt(count)+1
                        $("#cart-count").html(count)
                    }
                    
                }
            })
        }

        function search(input){
            if(input.value.trim()===''){
                $.ajax({
                    url:'/',
                    method:'get',
                    
                    success:function(res){
                        var viewProductsHtml=$(res).find('#view-products').html();
                        $('#view-products').html(viewProductsHtml)
                    }
                })
            }else{
                $.ajax({
                    url:'/find-product/'+input.value,
                    method:'get',

                    success: function(res){
                        var viewProductsHtml=$(res).find('#view-products').html()
                        $('#view-products').html(viewProductsHtml)
                    }
                })
            }
        }